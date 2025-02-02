import React, { useRef, useEffect, useState } from 'react';

// Editor font
import '@fontsource/courier-prime';

// Codemirror Imports
import { EditorView } from "codemirror"
import { EditorState, Compartment } from '@codemirror/state'
import { keymap, hoverTooltip, tooltips, highlightSpecialChars, drawSelection,
         dropCursor, crosshairCursor, lineNumbers } from "@codemirror/view"
import { indentWithTab, defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { StreamLanguage, indentUnit, HighlightStyle, syntaxHighlighting,
         indentOnInput, bracketMatching, foldKeymap } from "@codemirror/language"
import { searchKeymap, highlightSelectionMatches} from "@codemirror/search"
import { autocompletion, completionKeymap, closeBrackets,
         closeBracketsKeymap} from "@codemirror/autocomplete"
import { simpleMode } from "@codemirror/legacy-modes/mode/simple-mode";
import { linter, lintGutter } from "@codemirror/lint"
import { tags } from "@lezer/highlight"

// Handle singleton aya library across all editors
var _aya = [null];
function getAya() { return _aya[0]; }
function setAya(a) { _aya[0] = a; }

// Load a JS file on the client page by inserting a script element
function insertScriptElement(id, src) {
    if (!document.getElementById(id)) {
        const script = document.createElement("script");
        script.id = id;
        script.src = src;
        script.async = true;
        document.body.appendChild(script);
    }
}

// Load aya.js and aya-stdlib.js by inserting script tags into the document
function loadAya() {
    insertScriptElement('script-ayaweb-aya', '/js/aya.js');
    insertScriptElement('script-ayaweb-aya-stdlib', '/js/aya-stdlib.js');
}

// Initialize aya library
// `main` and `AYA_STDLIB` are defined by aya.js & aya-stdlib.js
function initAya(main) {
    if (getAya() == null) {
        if (main) {
            setAya({});
            main();
            const aya = getAya();
            aya.runIsolated = main.runIsolated;
            aya.addFile = main.addFile;
            aya.listFiles = main.listFiles;
            aya.lint = main.lint;

            // Create stdlib files
            for (const path of Object.keys(AYA_STDLIB)) {
                aya.addFile(path, AYA_STDLIB[path]);
            }
        } else {
            throw 'Aya unavaiable';
        }
    }
}

function getAyaInstance() {
    initAya(main);
    return getAya();
}

// Utility function to get the string value of a nested child
// This is used to get text from a MDX ```block``` or `inline` code
function getStrFromChild(element) {
    while (element.props) {
        element = element.props.children;
    }
    return element.trim();
}

// Use this function if aya crashes in an unexpected way
function crashMessage(msg, source) {
    return ('Fatal error. Please report this to github.com/aya-lang/aya\n'
        + msg + '\n'
        + 'Input source:\n'
        + '```\n'
        + source + '\n'
        + '```\n'
    );
}


// How to use:
//
// <Editor>
//    ```
//    .# Default code
//    .# Must be a block (triple back tick)
//    ```
//    `.# Default result (may be block or inline)`
// </Editor>
export default function Editor({children}) {
    var editorText = "";
    var outputText = "";

    // Get default code and default result from children
    // Default code must be a code block (triple back tick)
    // Default result may be a code block or inline code (triple or single back tick)
    if (Array.isArray(children)) {
        // Assumes an MDX code block is used inside the editor
        editorText = getStrFromChild(children[0]);
        outputText = getStrFromChild(children[1]);
    } else if (children) {
        editorText = getStrFromChild(children);
    }

    const [output, setOutput] = useState(outputText);
    const [view, setView] = useState(null);

    const editor = useRef();

    const getView = () => {
        return view;
    }

    const runCode = (view) => {
        const doc = view.state.doc.toString();
        try {
            const aya = getAyaInstance();

            // Add this header to all executed code so stdlib is available
            const header = "\"base/__aya__.aya\" :F ";

            var out = aya.runIsolated(header + doc);

            setOutput(out.trim());
            return true; // Don't run other events (i.e. insert newline)
        } catch (error) {
            // Aya caused some JS error, likely a VM bug
            setOutput(crashMessage(error.toString(), doc));
            return true;
        }
    }

    //
    // LINTER
    //

    // Basic linter checks for parse errors
    const customLinter = linter(view => {
        const aya = getAyaInstance();
        let diagnostics = []; // Diagnostic[]
        let source = view.state.doc.toString();

        let err = '';
        try {
            err = aya.lint(source);
        } catch (error) {
            // Aya caused some JS error, likely a VM bug
            console.error(crashMessage(error.toString(), source));
        }

        if (err.length > 0) {
            let err_parts = err.split(/:(.*)/s)
            let index = parseInt(err_parts[0]);
            let message = err_parts[1];
            diagnostics.push({
                from: index,
                to: index+1,
                severity: 'error',
                message: message.split('> File')[0],
            });
        }
        return diagnostics;
    });


    //
    // SYNTAX HIGHLIGHTER
    //

    const op_rgx = /[:.]?[A-Z><$%&!@\-=*?\\^|/+~;"\'#]/;

    const highlighterSimpleMode = simpleMode({
        // https://codemirror.net/5/demo/simplemode.html
        start: [
            // Comments
            {regex: /\.#.*/, token: 'comment'},

            // String
            {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},

            // Symbols
            {regex:/::[a-z_]+/,  token: 'atom' },
            {regex:/::M./,       token: 'atom' },
            {regex:/::[:.]?./,   token: 'atom' },
            {regex:/:::./,       token: 'atom' },

            // M* ops
            {regex: /M./, token: 'operator'},

            // Member access and assignment (.var and .:var)
            {regex: /\.?:[a-z_]+;/,  token: 'name' },
            {regex: /\.?:[a-z_]+/,  token: 'variableName' },

            // Numbers
            // This needs to be cleaned up...
            {regex: /:?\d+\.\d+[a-z]\d+\.\d\+/, token: 'number'},
            {regex: /:?\d+[a-z]\d+/,            token: 'number'},
            {regex: /:?\d+\.\d+[a-z]\d+/,       token: 'number'},
            {regex: /:?\d+\.\d+[a-z]/,          token: 'number'},
            {regex: /:?\d+\.\d+/,               token: 'number'},
            {regex: /:?\d+/,                    token: 'number'},

            // Characters
            {regex: /\'./, token: 'character'},

            // Operators
            {regex: op_rgx, token: 'operator'},

            // Open/close
            {regex: /[\{\[\(]/, indent: true},
            {regex: /[\}\]\)]/, dedent: true},

            // Block  comments
            {regex: /\.{/, token: "comment", next: "comment"},

            // Special names / keywords
            {regex: /(?:def|class|struct|if|while|else|do|self|from|import)\b/,
                token: "keyword"},

            // Standard variables
            {regex: /[a-z_]+/,  token: 'propertyName' },
        ],
        comment: [
            {regex: /.*?\.}/, token: "comment", next: "start"},
            {regex: /.*/, token: "comment"},
        ],
        languageData: {
            commentTokens: {line: ".#" , block: {start: ".{", end: ".}"}}
        }
    });


    let streamLang = StreamLanguage.define(highlighterSimpleMode);

    let cBlue      = '#4078F2';
    let cLightBlue = '#0184BC';
    let cGold      = '#986801';
    let cGreen     = '#50A14F';
    let cPurple    = '#A626A4';
    let cRed       = '#E45649';
    let cDark      = '#4e5b42';

    let customHighlightStyle = HighlightStyle.define([
        { tag: tags.comment, color: '#A0A1A7', fontStyle: 'italic'},
        { tag: tags.number, color: cLightBlue},
        { tag: tags.character, color: cLightBlue},
        { tag: tags.operator, color: cPurple},//, fontWeight:'bold'},
        { tag: tags.string, color: cGold},
        { tag: tags.atom, color: cBlue},
        { tag: tags.keyword, color: cRed},
        { tag: tags.name, color: cGreen, fontWeight: 'bold'},
        { tag: tags.variableName, color: cGreen},
        { tag: tags.propertyName, color: cDark},

    ]);


    //
    // TOOLTIP
    //

    const hoverTooltipFunction = function(view, pos, side) {
        let {from, to, text} = view.state.doc.lineAt(pos)
        let start = pos, end = pos + 1
        var thistext = text.slice(start - from, end - from);

        if (thistext.trim().length == 0) return null;

        // Look behind to see if there is a ., :, or M
        // TODO: Look ahead if we are currently at a ., :, or M
        if (start > from) {
            const pre = text[start - from - 1];
            if (pre == 'M' || pre == '.' || pre == ':') {
                thistext = pre + thistext;
            }
        }

        // Op Doc begins with "<op> (<types>)", search for "<op> ("
        const query = (thistext + " (").trim();
        // TODO: Pre load all operator info when aya loads so we don't have to call into the VM
        const aya = getAyaInstance();
        var info = aya.runIsolated('"' + query + '" M? .[0] :P').trim();

        if (!info.startsWith(query)) return null;

        return {
            pos: pos, //start,
            pos, //end,
            above: true,
            create(view) {
                let dom = document.createElement("div")
                dom.className = 'my-editor-tooltip'

                // Header
                let header = document.createElement('p');
                header.className = 'my-editor-tooltip-header';
                header.textContent = thistext;
                dom.appendChild(header);

                // Body
                let body = document.createElement('p');
                body.className = 'my-editor-tooltip-body';
                body.innerHTML = info;
                dom.appendChild(body);

                return {dom}
            }
        }
    }

    useEffect(() => {

        loadAya();

        const startState = EditorState.create({
            doc: editorText,
            extensions: [
                customLinter,
                lintGutter(),
                keymap.of(indentWithTab),
                lineNumbers(),
                //highlightActiveLineGutter(),  // @codemirror/view
                //highlightActiveLine(),        // @codemirror/view
                highlightSpecialChars(),
                history(),
                drawSelection(),
                dropCursor(),
                EditorState.allowMultipleSelections.of(true),
                indentOnInput(),
                indentUnit.of("  "),
                syntaxHighlighting(customHighlightStyle),
                streamLang,
                bracketMatching(),
                closeBrackets(),
                autocompletion(),
                crosshairCursor(),
                highlightSelectionMatches(),
                tooltips({parent: editor.current}),
                hoverTooltip(hoverTooltipFunction, {hoverTime: 50}),
                keymap.of([
                    {key: 'Ctrl-Enter', run: runCode},
                ]),
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...searchKeymap,
                    ...historyKeymap,
                    ...foldKeymap,
                    ...completionKeymap,
                ]),
            ],
        });

        setView(new EditorView({
          state: startState,
          parent: editor.current,
        }));

        return () => {
            //view.destroy();
        }
    }, [])

    return (<div className={'my-editor'}>
        <div className={'my-editor-top-bar'}>
        </div>
        <div className={'my-editor-wrapper'}>
            <button className={'my-editor-play-button'}
                    title="Run"
                    onClick={() => runCode(getView())}>&#9658;
            </button>
            <div ref={editor}> </div>
        </div>
        <div className={'my-editor-output'}>
            {output}
        </div>
    </div>);
}
