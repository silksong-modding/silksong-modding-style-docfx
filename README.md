# Silksong Modding DocFx Theme

A custom docfx theme for the [Silksong Modding Docs](https://docs.silksong-modding.org/).

## Contributing

### Tools You'll Need

- [Docfx](https://dotnet.github.io/docfx/)
- [Sass](https://sass-lang.com/install/)
- [UglifyJS](https://github.com/mishoo/UglifyJS)

### Setting Up Your Local Repositories

When you're editing UI, you typically want to be able to look at what you're doing while you're working. When you're working on a PR, you generally want to be able to push/pull changes to/from github. This is a problem when you want to edit the docs theme; because it's a submodule that needs to be part of a website to be seen and used, and submodules by default aren't connected to their original repository.

This is how to connect a submodule in a cloned repository to a remote origin, so you can have both conveniences:

1. Pick a repository which uses this theme theme for its docs to be your test space. For example, [FsmUtil](https://github.com/silksong-modding/Silksong.FsmUtil).
2. Run `git clone --recurse-submodules https://github.com/...` to clone the parent repository including the contents of submodules.
3. Navigate into the parent repository, then run `git submodule set-url -- docs/silksong-modding-style-docfx https://github.com/[USERNAME]/silksong-modding-style-docfx.git` to attach the local copy of the submodule to (your fork of) the theme repository.
4. From now on, using `git` commands inside the parent repository folder will target the parent repository; and using commands from within the `docs/silksong-modding-style-docfx` subfolder will target the submodule repository.
5. Navigate into the `docs/silksong-modding-style-docfx` subfolder. Run `git fetch` to pull the latest changes, checkout the branch you want, etc.

I would recommend making a new article in the parent repository's docs that includes a variety of content like lists, warning boxes, tables, etc, as a more complete demo to work on.

### Making Changes

To edit the theme's...
- **DocFx Config:** edit `main.js` and `common-pre-transform.js`.
- **Styles:** edit `public/main.scss` and files in the `public/scss-partials/` directory.
- **JavaScript:** edit `public/dynamic-content.js`.
- **HTML:** edit `layout/_master.tmpl` and files in the `partials/` directory.

To build the styles/javascript after editing them, from the `docs/silksong-modding-style-docfx/public` folder, run the commands:
- **Styles:** `sass main.scss:main.css --style compressed`
- **JavaScript:** `uglifyjs -c -m --module --source-map "url='dynamic-content.min.js.map'" -o "./dynamic-content.min.js" -- "./dynamic-content.js"`

With your terminal in the `docs/silksong-modding-style-docfx` subfolder, you can:
- Run `docfx ../docfx.json --serve` to build and locally preview the parent repository's website, so you can see what you're doing.
- Use `git` to fetch/pull/push from your fork of the docs theme repository.
