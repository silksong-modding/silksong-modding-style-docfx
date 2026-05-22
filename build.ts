import * as sass from "sass";
import uglifyjs from "uglify-js";
import fs from "node:fs";
import path from "node:path";
import console from "node:console";
import process from "node:process";
import url from "node:url";

if (process.argv.some((x) => x === "--clean")) clean();
else build();

function clean(): void {
  [
    path.join(".", "build"),
    ...["bin", "obj"].map((x) => path.join(".", "test-mod", x)),
    ...["silksong-modding", "api", "_site"].map((x) => path.join(".", "test-mod", "docs", x)),
  ].forEach((x) => fs.rmSync(x, { recursive: true, force: true }));
}

function build(): void {
  const isTestBuild = process.argv.some((x) => x === "--test"),
    srcRoot = path.join(".", "src"),
    destRoot = isTestBuild
      ? path.join(".", "test-mod", "docs", "silksong-modding")
      : path.join(".", "build");

  console.log(`Building to directory "${destRoot}" ...`);

  for (const file of fs.readdirSync(srcRoot, { recursive: true, withFileTypes: true })) {
    if (!file.isFile()) continue;
    const ext = path.extname(file.name),
      extLower = ext.toLowerCase(),
      splitDir = file.parentPath.split(path.sep),
      destDir = path.join(destRoot, ...splitDir.slice(1));
    const isScss = extLower === ".scss",
      isJs = extLower === ".js",
      shouldCompileScss = !file.name.startsWith("_"), // don't compile partials
      shouldMinifyJs =
        path.basename(file.name, ext) !== "main" && splitDir.some((x) => x === "public"),
      shouldCopyOriginal = (!isScss && !isJs) || (isJs && !shouldMinifyJs);

    if (isTestBuild || shouldCopyOriginal) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(fullPath(file), path.join(destDir, file.name));
    }

    try {
      if (isScss && shouldCompileScss) compileScss(file, destDir, isTestBuild);
      else if (isJs && shouldMinifyJs) minifyJs(file, destDir, isTestBuild);
    } catch (e) {
      console.error(`Failed to compile ${fullPath(file)}:`, e);
    }
  }

  function fullPath(file: fs.Dirent<string>): string {
    return path.join(file.parentPath, file.name);
  }

  function compileScss(file: fs.Dirent<string>, destDir: string, sourceMap: boolean): void {
    if (file.name.startsWith("_")) return;

    fs.mkdirSync(destDir, { recursive: true });

    const result = sass.compile(fullPath(file), { sourceMap, style: "compressed" }),
      cssName = `${path.basename(file.name, ".scss")}.css`,
      cssPath = path.join(destDir, cssName);

    fs.writeFileSync(cssPath, result.css);

    if (result.sourceMap) {
      const mapName = `${cssName}.map`,
        mapPath = path.join(destDir, mapName);

      // use relative source urls instead of absolute file:/// source urls
      result.sourceMap.sources.forEach(
        (s, i, arr) =>
          (arr[i] = path.relative(file.parentPath, url.fileURLToPath(s)).replaceAll(path.sep, "/")),
      );

      fs.appendFileSync(cssPath, `/*# sourceMappingURL=${mapName} */`);
      fs.writeFileSync(mapPath, JSON.stringify(result.sourceMap));
    }
  }

  function minifyJs(file: fs.Dirent<string>, destDir: string, sourceMap: boolean): void {
    fs.mkdirSync(destDir, { recursive: true });

    const jsName = `${path.basename(file.name, path.extname(file.name))}.min.js`,
      jsPath = path.join(destDir, jsName),
      mapName = `${file.name}.map`,
      result = uglifyjs.minify(
        { [file.name]: fs.readFileSync(fullPath(file)).toString() },
        {
          mangle: true,
          module: true,
          sourceMap: sourceMap ? { url: mapName } : false,
        },
      );

    if (result.error) throw result.error;

    fs.writeFileSync(jsPath, result.code);
    if (result.map) fs.writeFileSync(path.join(destDir, mapName), result.map);
  }
}
