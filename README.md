# Silksong Modding DocFx Theme

A custom docfx theme for the [Silksong Modding Docs](https://docs.silksong-modding.org/).

## Using the Theme

Pushes to `main` build the theme into the `dist` branch, then trigger a docs rebuild in every
repository listed in [`.forgejo/docs-consumers.txt`](.forgejo/docs-consumers.txt).

A consuming repository builds its docs with the shared workflow, which downloads `dist`, runs docfx
and deploys `_site` to git-pages at `https://<owner>.pages.silksong-modding.org/<repo>/`:

```yaml
# .forgejo/workflows/docs.yml
name: Docs

on:
  push:
    branches: [main]
  # Triggered by silksong-modding-style-docfx when the theme changes.
  workflow_dispatch:

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  docs:
    # A host-qualified reusable workflow runs as a single job, so it needs a runner label.
    runs-on: ubuntu-latest
    uses: https://git.silksong-modding.org/silksong-modding/silksong-modding-style-docfx/.forgejo/workflows/build-docs.yml@main
    with:
      docs-path: docs # directory containing docfx.json
      # dotnet-build: false # skip `dotnet build` for docs-only repos
```

To get rebuilds when the theme changes:

1. Add the repository and its workflow file name to `.forgejo/docs-consumers.txt`.
2. Give the `docs-bot` account write access to the repository's **Actions** unit (the `Docs bot` org
   team: Actions write, everything else read or none). That's all the dispatch API needs, so the bot
   can't push code.
3. Protect the default branch: anyone who can push there controls what the dispatched workflow
   deploys.

The `DOCS_BOT_TOKEN` secret on this repository is a `docs-bot` token with the `write:repository`
scope.

## Contributing

### Prerequisites

- [Docfx](https://dotnet.github.io/docfx/)
- [Node.js](https://nodejs.org/en), v22.18.0 or later.
  - It's recommended to install Node with a version manager, such as
    [nvm](https://github.com/nvm-sh/nvm#intro) or [mise](https://mise.jdx.dev/getting-started.html).
- Familiarity with [Sass](https://sass-lang.com/install/)

### Setting Up Your Local Repository

1. Make a fork of this repository and clone it locally.
1. From within your local copy, run the command `npm install` to install dependencies.
1. Make your edits to the files in the `src` directory, then run the command `npm run test` to build
   and locally preview the theme.

Files built by `npm run test` go to the `test-mod/docs/silksong-modding` subdirectory.

### Making Changes

The theme's source files are all found under the `src` directory.

To edit the theme's...

- **DocFx Config:** Edit `public/main.js` and `common-pre-transform.js`.
- **Styles:** Edit `public/main.scss` and files in the `public/scss-partials/` directory. All sass
  partials' names **must** start with an underscore (`_`).
- **JavaScript:** Edit `public/dynamic-content.js`.
- **HTML:** Edit `layout/_master.tmpl` and files in the `partials/` directory.
