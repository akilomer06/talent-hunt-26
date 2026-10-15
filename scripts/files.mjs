import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
// stat follows OneDrive file placeholders, which some CLI globbers skip as links.
export async function filesIn(directory) {
  const result = [];
  for (const name of await readdir(directory)) {
    const path = join(directory, name);
    if ((await stat(path)).isDirectory()) result.push(...(await filesIn(path)));
    else result.push(path);
  }
  return result;
}
