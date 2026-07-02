#!/usr/bin/env node
/**
 * Usage (from monorepo root):
 *   pnpm shadcn input
 *   pnpm shadcn button card badge
 *
 * Equivalent to `pnpm dlx shadcn@latest add <components>` + import fix + index update.
 */

import { execSync } from "child_process"
import { readdirSync, readFileSync, writeFileSync } from "fs"
import { join, relative, dirname, resolve } from "path"
import { fileURLToPath } from "url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PKG_SRC = join(ROOT, "packages/shadcn-ui/src")

const components = process.argv.slice(2)
if (!components.length) {
  console.error("Usage: pnpm shadcn <component> [component2 ...]")
  process.exit(1)
}

// ── 1. Install via shadcn CLI ────────────────────────────────────────────────
console.log(`\n→ Installing: ${components.join(", ")}...\n`)
execSync(
  `pnpm dlx shadcn@latest add ${components.join(" ")}`,
  { stdio: "inherit", cwd: ROOT }
)

// ── 2. Fix @/ imports → relative (Turbopack resolves @/ from the app, not package) ──
console.log("\n→ Fixing imports...")

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
    console.log("  ✓", relative(ROOT, filePath).replace(/\\/g, "/"))
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

// ── 3. Regenerate index.ts ───────────────────────────────────────────────────
console.log("\n→ Updating src/index.ts...")
execSync("node scripts/shadcn-fix.mjs", { stdio: "inherit", cwd: ROOT })

console.log("\nDone! Component(s) ready in packages/shadcn-ui ✓\n")
