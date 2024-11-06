import Editor from '@site/src/components/Editor'

# Examples

:::warning

The web version of aya has known bugs and is still in development

:::

## ASCII Train

Print ASCII art of a train using the `asciiart` standard library module.

<Editor>
    ```
    import ::asciiart

    {
      " 6_`|6 |` ()--()"_\L"  ~"_T.join
    } :train;

    3 train
    ```
    ```
    asciiart:
     ______   ______   ______
    |      | |      | |      |
     ()--() ~ ()--() ~ ()--()
    ```
</Editor>


## Collatz Sequence

<Editor>
    ```
    {
      .# Golfed implementation of the collatz conjecture
      $1={;0}{0\{n,Bn2:%n3*Bn2/.?$1>}W;}.?
    }:collatz;

    .# The first 10 collatz numbers (https://oeis.org/A006577)
    [10, collatz]
    ```
    `[ 0 1 7 2 5 8 16 3 19 6 ]`
</Editor>





## 2D Vector Type

Define a 2D vector type with print and operator overloads.
Note that this is supported by Aya natively using standard lists `[x y]`.

<Editor>
    ```
    struct vec {x y} ;

    .# Member function
    def vec::len {self,
        self.x 2^ self.y 2^ + .^
    }

    .# Print overload
    def vec::__repr__ {self,
        .# Aya supports string interpolation
        "<$(self.x),$(self.y)>"
    }

    .# Operator overload
    def vec::__add__ {self other,
        self.x other.x +
        self.y other.y +
        vec!
    }

    3 4 vec! :v;
    5 8 vec! :w;

    "v is $v" :P
    "v.len is $(v.len)" :P
    "v+w is $(v w +)" :P
    ```
    ```
    v is <3,4>
    v.len is 5
    v+w is <8,12>
    ```
</Editor>


# Editor Features

:::info

  - Hover over an operator to view documentation
  - `Shift+Enter` or `►` to run
  - Automatic linting, syntax highlighting, auto-indent, undo history and more supported using [CodeMirror](https://codemirror.net/)

:::

## Linter

<Editor>
    ```
    {
        0\1{$@+}@%;
    }:fib; )

    "The 10th Fibonacci number is $(10 fib)" :P
    ```
</Editor>

