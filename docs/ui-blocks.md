# UI Blocks Package

**Location:** `packages/ui-blocks/`
**Package name:** `ui-blocks`

The `ui-blocks` package is the shared component library used across all three apps. It contains reusable UI blocks (e.g. hero sections) built on top of shadcn/ui primitives and Tailwind CSS.

---

## Directory Structure

```
packages/ui-blocks/
├── src/
│   ├── index.ts                    # Main entry — exports all blocks
│   ├── hero/
│   │   ├── hero1/
│   │   │   └── index.tsx           # Hero1 block
│   │   └── hero4/
│   │       └── index.tsx           # Hero4 block
│   ├── components/
│   │   └── ui/                     # shadcn/ui primitives
│   │       ├── accordion.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── separator.tsx
│   └── lib/
│       └── utils.ts                # cn() utility (clsx + tailwind-merge)
├── tsup.config.ts                  # Build config (CJS + ESM output)
├── tsconfig.json
└── package.json
```

---

## Naming Convention

Blocks follow a strict naming pattern:

```
src/<category>/<variant>/index.tsx
```

Examples:
- `src/hero/hero1/index.tsx` → exported as `Hero1`
- `src/hero/hero4/index.tsx` → exported as `Hero4`

The block is always the **default export** from its `index.tsx`, and re-exported as a **named export** from `src/index.ts`.

---

## Available Blocks

| Export | File | Description |
|--------|------|-------------|
| `Hero1` | `src/hero/hero1/index.tsx` | Hero section with Card and Button |
| `Hero4` | `src/hero/hero4/index.tsx` | Minimal hero section |

---

## Utility

The `cn()` helper is available from `src/lib/utils.ts` for combining Tailwind class names:

```ts
import { cn } from "@/lib/utils";

cn("text-sm font-bold", isActive && "text-blue-500")
```

---

## Build

The package is bundled with **tsup** and outputs both CJS and ESM formats:

```bash
pnpm --filter ui-blocks build
```

Build output goes to `dist/`. Source maps and TypeScript declarations (`.d.ts`) are included.
