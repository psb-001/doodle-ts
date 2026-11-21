import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../dist-lib/", import.meta.url).pathname;

function files(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? files(path) : path.endsWith(".js") ? [path] : [];
  });
}

const specifier = /((?:from|import)\s*["'])(\.[^"']+?)(["'])/g;

for (const file of files(root)) {
  const source = readFileSync(file, "utf8");
  const fixed = source.replace(specifier, (match, prefix, path, suffix) => {
    if (path.endsWith(".js") || path.endsWith(".json") || path.endsWith(".mjs")) return match;
    return `${prefix}${path}.js${suffix}`;
  });
  if (fixed !== source) writeFileSync(file, fixed, "utf8");
}

console.log(`Fixed ESM specifiers in ${files(root).length} files.`);
