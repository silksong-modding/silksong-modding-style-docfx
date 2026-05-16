import * as sass from "sass";
import uglifyjs from "uglify-js";
import fs from "node:fs";
import path from "node:path";
import { log } from "node:console";
import { argv } from "node:process";
import { fileURLToPath } from "node:url";

const testing = !!argv.find(x => x === "--test");
const
	srcRoot = path.join(".", "src"),
	buildRoot =
		testing
		? path.join(".", "test-mod", "docs", "silksong-modding-style-docfx")
		: path.join(".", "build");

log(`Building to directory "${buildRoot}" ...`);

for (const file of fs.readdirSync(srcRoot, { recursive: true, withFileTypes: true })) {

	if (!file.isFile())
		continue;

	const
		ext = path.extname(file.name),
		oldFile = path.join(file.path, file.name),
		builtDir = path.join(buildRoot, ...file.path.split(path.sep).slice(1));

	const isCopyableJs = (!file.path.endsWith("public") || file.name === "main.js");

	if (testing || (ext !== ".scss" && (ext !== ".js" || isCopyableJs))) {
		fs.mkdirSync(builtDir, { recursive: true });
		fs.copyFileSync(path.join(file.path, file.name), path.join(builtDir, file.name));
	}

	if (ext === ".scss" && !file.name.startsWith("_")) {
		const
			result = sass.compile(oldFile, { sourceMap: testing, style: "compressed" } ),
			cssName = `${path.basename(file.name, ".scss")}.css`,
			cssPath = path.join(builtDir, cssName),
			mapPath = path.join(builtDir, `${cssName}.map`);

		fs.mkdirSync(builtDir, { recursive: true });
		if (testing) {
			for (let i = 0; i < result.sourceMap.sources.length; i++) {
				result.sourceMap.sources[i] = path.relative(file.path, fileURLToPath(result.sourceMap.sources[i])).replaceAll(path.sep, "/");
			}
			fs.writeFileSync(cssPath, result.css + `/*# sourceMappingURL=${`${cssName}.map`} */`);
			fs.writeFileSync(mapPath, JSON.stringify(result.sourceMap));
		}
		else {
			fs.writeFileSync(cssPath, result.css);
		}
	}

	else if (ext === ".js" && !isCopyableJs) {
		const
			result = uglifyjs.minify(fs.readFileSync(oldFile).toString(), {
				mangle: true, module: true, sourceMap: testing ? { url: `${file.name}.map` } : undefined
			}),
			jsName = `${path.basename(file.name, ".js")}.min.js`,
			jsPath = path.join(builtDir, jsName),
			mapPath = path.join(builtDir, `${file.name}.map`);

		fs.mkdirSync(builtDir, { recursive: true });
		fs.writeFileSync(jsPath, result.code);

		if (testing) {
			const mapObj = JSON.parse(result.map);
			mapObj.sources = [ file.name ];
			fs.writeFileSync(mapPath, JSON.stringify(mapObj));
		}
	}
}
