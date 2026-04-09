import { minify, transform } from "@swc/core";
import { readFileSync, writeFileSync } from "node:fs";

for (const file of ["dist/index.mjs", "dist/index.cjs"]) {
  const code = readFileSync(file, "utf8");
  const isESM = file.endsWith(".mjs");
  let result;
  if (isESM) {
    // Use transform for ESM (supports export/import syntax)
    result = await transform(code, {
      minify: true,
      jsc: {
        parser: { syntax: "ecmascript" },
        target: "es2022",
        minify: { compress: true, mangle: true },
      },
      module: { type: "es6" },
      isModule: true,
    });
  } else {
    result = await minify(code, { compress: true, mangle: true });
  }
  writeFileSync(file, result.code);
  const pct = ((1 - result.code.length / code.length) * 100).toFixed(1);
  console.log(`  ${file}: ${code.length} → ${result.code.length} (-${pct}%)`);
}
