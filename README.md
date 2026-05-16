# Silksong Modding DocFx Theme

A custom docfx theme for the [Silksong Modding Docs](https://docs.silksong-modding.org/).

## Contributing

### Prerequisites

- [Docfx](https://dotnet.github.io/docfx/)
- [Node.js](https://nodejs.org/en)
- Familiarity with [Sass](https://sass-lang.com/install/)

### Setting Up Your Local Repository

1. Make a fork of this repository and clone it locally.
1. From within your local copy, run the command `npm install` to install dependencies.
1. Make your edits to the files in the `src` directory, then run the command `npm run test` to build and locally preview the theme.

Files built by `npm run test` go to the `test-mod/docs/silksong-modding-style-docfx` subdirectory.

### Making Changes

The theme's source files are all found under the `src` directory.

To edit the theme's...
- **DocFx Config:** Edit `public/main.js` and `common-pre-transform.js`.
- **Styles:** Edit `public/main.scss` and files in the `public/scss-partials/` directory. All sass partials' names **must** start with an underscore (`_`).
- **JavaScript:** Edit `public/dynamic-content.js`.
- **HTML:** Edit `layout/_master.tmpl` and files in the `partials/` directory.
