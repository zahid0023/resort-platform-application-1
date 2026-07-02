#!/usr/bin/env node
/**
 * Run after `pnpm dlx shadcn@latest add <component>` to:
 *  1. Fix @/ imports → relative paths (required: Turbopack uses app tsconfig, not package tsconfig)
 *  2. Regenerate packages/shadcn-ui/src/index.ts
 *
 * Usage:
 *   pnpm shadcn:fix
 */

import { readdirSync, readFileSync, writeFileSync } from "fs"
import { join, relative, dirname, resolve } from "path"
import { fileURLToPath } from "url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PKG_SRC = join(ROOT, "packages/shadcn-ui/src")

// ── 1. Fix @/ imports ────────────────────────────────────────────────────────
function resolveAlias(filePath, alias) {
  const stripped = alias.replace(/^@\//, "")
  const absTarget = join(PKG_SRC, stripped)
  let rel = relative(dirname(filePath), absTarget).replace(/\\/g, "/")
  if (!rel.startsWith(".")) rel = "./" + rel
  return rel
}

function fixFile(filePath) {
  let src = readFileSync(filePath, "utf8")
  const orig = src
  src = src.replace(/from ["'](@\/[^"']+)["']/g, (_, alias) => {
    return `from "${resolveAlias(filePath, alias)}"`
  })
  if (src !== orig) {
    writeFileSync(filePath, src, "utf8")
    console.log("  ✓ fixed", relative(ROOT, filePath).replace(/\\/g, "/"))
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) fixFile(full)
  }
}

walk(PKG_SRC)

// ── 2. Regenerate index.ts ───────────────────────────────────────────────────
const uiExports = readdirSync(join(PKG_SRC, "components/ui"))
  .filter((f) => f.endsWith(".tsx"))
  .sort()
  .map((f) => `export * from "./components/ui/${f.replace(".tsx", "")}"`)

const hookExports = readdirSync(join(PKG_SRC, "hooks"))
  .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
  .sort()
  .map((f) => `export * from "./hooks/${f.replace(/\.tsx?$/, "")}"`)

const content = [
  "// UI Components",
  ...uiExports,
  "",
  "// Hooks",
  ...hookExports,
  "",
  "// Utils",
  'export * from "./lib/utils"',
  "",
].join("\n")

writeFileSync(join(PKG_SRC, "index.ts"), content, "utf8")
console.log("✓ packages/shadcn-ui/src/index.ts updated")
