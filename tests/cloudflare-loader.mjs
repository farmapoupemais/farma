import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const stubUrl = new URL("./cloudflare-workers-stub.mjs", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") return { url: stubUrl, shortCircuit: true };
  const resolved = await nextResolve(specifier, context);
  if (resolved.url.endsWith(".ts") || resolved.url.endsWith(".tsx")) {
    return {
      ...resolved,
      format: "module",
      shortCircuit: true,
    };
  }
  return resolved;
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts") || url.endsWith(".tsx")) {
    const filePath = fileURLToPath(url);
    const source = await fs.readFile(filePath, "utf8");
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    return {
      format: "module",
      source: transpiled.outputText,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}

