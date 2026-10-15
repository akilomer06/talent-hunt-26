import { readFile } from "node:fs/promises";
import { ESLint } from "eslint";
import { filesIn } from "./files.mjs";
const eslint = new ESLint();
const files = (await filesIn("src")).filter((f) => /\.tsx?$/.test(f));
const results = [];
for (const file of files)
  results.push(
    ...(await eslint.lintText(await readFile(file, "utf8"), {
      filePath: file,
    })),
  );
const report = await eslint.loadFormatter("stylish");
const output = report.format(results);
if (output) console.log(output);
console.log(
  `Linted ${files.length} TypeScript/TSX source files, including OneDrive placeholders.`,
);
if (results.some((r) => r.errorCount > 0)) process.exitCode = 1;
