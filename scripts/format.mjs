import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { extname } from "node:path";
import * as prettier from "prettier";
import { filesIn } from "./files.mjs";
const files = [];
for (const directory of ["src", "scripts", "tests"])
  files.push(...(await filesIn(directory)));
for (const name of await readdir("."))
  if ((await stat(name)).isFile()) files.push(name);
const supported = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".html",
  ".css",
  ".md",
]);
let checked = 0,
  changed = 0;
for (const file of files.filter((f) => supported.has(extname(f)))) {
  const before = await readFile(file, "utf8");
  const after = await prettier.format(before, { filepath: file });
  checked++;
  if (before !== after) {
    changed++;
    if (process.argv.includes("--write")) await writeFile(file, after);
    else console.error(`Formatting needed: ${file}`);
  }
}
console.log(
  `${checked} files checked; ${changed} ${process.argv.includes("--write") ? "formatted" : "need formatting"}.`,
);
if (changed && !process.argv.includes("--write")) process.exitCode = 1;
