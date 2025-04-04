import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Aya',
  tagline: 'Pocket sized programs',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://npaul.co/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'aya-lang', // Usually your GitHub org/user name.
  projectName: 'aya', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Aya',
      //logo: {
      //  alt: 'My Site Logo',
      //  src: 'img/logo.svg',
      //},
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        //{to: '/blog', label: 'Blog', position: 'left'},
        {to: '/pad', label: 'Pad', position: 'left'},
        {to: '/examples', label: 'Examples', position: 'left'},
        {
          href: 'https://github.com/aya-lang/aya',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      //links: [
      //  {
      //    title: 'Docs',
      //    items: [
      //      {
      //        label: 'Tutorial',
      //        to: '/docs/intro',
      //      },
      //    ],
      //  },
      //  {
      //    title: 'Community',
      //    items: [
      //      {
      //        label: 'Discord',
      //        href: 'https://discordapp.com/invite/docusaurus',
      //      },
      //    ],
      //  },
      //  {
      //    title: 'More',
      //    items: [
      //      {
      //        label: 'Blog',
      //        to: '/blog',
      //      },
      //      {
      //        label: 'GitHub',
      //        href: 'https://github.com/facebook/docusaurus',
      //      },
      //    ],
      //  },
      //],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
