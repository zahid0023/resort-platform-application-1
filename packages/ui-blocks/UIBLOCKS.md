# UI Blocks

A guide covering how to implement a new UI block, publish it to the registry, and consume it in an application.

---

## Table of Contents

1. [Overview](#overview)
2. [Implementing a UI Block](#implementing-a-ui-block)
3. [Publishing a UI Block](#publishing-a-ui-block)
4. [Consuming UI Blocks in an Application](#consuming-ui-blocks-in-an-application)

---

## Overview

A **UI Block** is a self-contained, configurable React component. Each block is made up of three files:

| File | Purpose |
|---|---|
| `index.tsx` | The React component with typed props |
| `schema.json` | Metadata + editable prop definitions (drives the live editor) |
| `default.json` | Default values for every prop |

All blocks live under `packages/ui-blocks/src/<category>/<block-key>/` and are registered centrally in `src/registry/index.tsx`.

```
packages/ui-blocks/src/
├── registry/
│   └── index.tsx          ← central block registry
├── hero/
│   ├── hero1/
│   │   ├── index.tsx
│   │   ├── schema.json
│   │   └── default.json
│   └── hero4/
│       ├── index.tsx
│       ├── schema.json
│       └── default.json
└── <category>/
    └── <block-key>/
        ├── index.tsx
        ├── schema.json
        └── default.json
```

---

## Implementing a UI Block

### Step 1 — Create the folder

Create a folder at `src/<category>/<block-key>/`. Use lowercase kebab-case. The key must be unique across the registry.

```
src/hero/hero5/
```

### Step 2 — Write `default.json`

Define the default values for every prop your component accepts. These are used both as React default props and as the starting values in the live editor.

```json
// src/hero/hero5/default.json
{
  "title": "Welcome",
  "subtitle": "Discover something amazing",
  "ctaText": "Get Started",
  "ctaVariant": "default",
  "showBadge": true,
  "accentColor": "#6366f1"
}
```

### Step 3 — Write `schema.json`

The schema describes the block's identity and each editable prop. The `props` array drives the live edit panel in the preview page.

```json
// src/hero/hero5/schema.json
{
  "key": "hero5",
  "name": "Hero 5",
  "description": "A full-width hero with accent color, badge toggle, and a single CTA.",
  "category": "Hero",
  "props": [
    {
      "name": "title",
      "type": "string",
      "label": "Title"
    },
    {
      "name": "subtitle",
      "type": "string",
      "label": "Subtitle"
    },
    {
      "name": "ctaText",
      "type": "string",
      "label": "CTA Button Text"
    },
    {
      "name": "ctaVariant",
      "type": "select",
      "label": "CTA Button Variant",
      "options": ["default", "outline", "secondary", "ghost"]
    },
    {
      "name": "showBadge",
      "type": "boolean",
      "label": "Show Badge"
    },
    {
      "name": "accentColor",
      "type": "color",
      "label": "Accent Color"
    }
  ]
}
```

#### Supported prop types

| `type` | Editor control | TypeScript type |
|---|---|---|
| `"string"` | Text input | `string` |
| `"number"` | Number input | `number` |
| `"boolean"` | Checkbox | `boolean` |
| `"select"` | Dropdown (requires `options`) | `string` |
| `"color"` | Color picker + hex input | `string` |

### Step 4 — Write `index.tsx`

Import defaults from `default.json` so the component is self-contained and can be rendered without any props.

```tsx
// src/hero/hero5/index.tsx
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import defaults from "./default.json";

export interface Hero5Props {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaVariant?: "default" | "outline" | "secondary" | "ghost";
  showBadge?: boolean;
  accentColor?: string;
}

const Hero5 = ({
  title = defaults.title,
  subtitle = defaults.subtitle,
  ctaText = defaults.ctaText,
  ctaVariant = defaults.ctaVariant as Hero5Props["ctaVariant"],
  showBadge = defaults.showBadge,
  accentColor = defaults.accentColor,
}: Hero5Props) => {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      {showBadge && (
        <Badge style={{ backgroundColor: accentColor }} className="text-white">
          New
        </Badge>
      )}
      <h1 className="text-5xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-lg text-muted-foreground">{subtitle}</p>
      <Button variant={ctaVariant} style={{ backgroundColor: accentColor }}>
        {ctaText}
      </Button>
    </div>
  );
};

export default Hero5;
```

**Rules to follow:**

- Every prop must be optional (`?`) with a default pulled from `default.json`.
- Only use components from `../../components/ui/` (the shared UI kit within this package).
- Do not use `useState`, `useEffect`, or any server-only APIs — blocks must be pure presentational components.
- Do not hardcode text strings directly in JSX — they must come through props.

---

## Publishing a UI Block

"Publishing" means registering the block so it appears in the gallery and preview page, and is exported from the package.

### Step 1 — Register in `src/registry/index.tsx`

Import the component, schema, and defaults, then add an entry to `UI_BLOCKS_INDEX`.

```tsx
// src/registry/index.tsx
import Hero5 from "../hero/hero5";
import hero5Schema from "../hero/hero5/schema.json";
import hero5Defaults from "../hero/hero5/default.json";

export const UI_BLOCKS_INDEX: UiBlockMeta[] = [
  // ... existing blocks ...
  {
    key: hero5Schema.key,
    name: hero5Schema.name,
    description: hero5Schema.description,
    category: hero5Schema.category,
    component: Hero5 as ComponentType<Record<string, unknown>>,
    schema: hero5Schema as UiBlockSchema,
    defaults: hero5Defaults,
  },
];
```

The block is now live in the registry. The gallery and preview page will pick it up automatically — no other registry changes are needed.

### Step 2 — Export from `src/index.ts`

Add a named export so consumers can import the component directly.

```ts
// src/index.ts
export { default as Hero5 } from "./hero/hero5";
```

### Step 3 — Build the package (for external consumers)

If the consuming app resolves the package via the built `dist/` rather than the TypeScript source directly, rebuild:

```bash
# From the monorepo root
pnpm --filter ui-blocks build

# Or from the package directory
pnpm build
```

For apps in the same monorepo using `"ui-blocks": "workspace:*"` with source-based resolution, no build step is needed — changes are live immediately.

---

## Consuming UI Blocks in an Application

### Installation

The package is published as a workspace dependency. Add it to your app's `package.json`:

```json
{
  "dependencies": {
    "ui-blocks": "workspace:*"
  }
}
```

Then install:

```bash
pnpm install
```

For applications outside the monorepo, install from the npm registry (once published):

```bash
pnpm add ui-blocks
```

---

### Rendering a single block by key

Use `UIBlockRenderer` when you have a block key (e.g. stored in a database) and want to render it with custom props.

```tsx
import { UIBlockRenderer } from "ui-blocks";

export function MyPage() {
  return (
    <UIBlockRenderer
      uiBlockKey="hero1"
      props={{
        title: "Grand Resort",
        subtitle: "Book your stay today",
        buttonText: "Reserve Now",
        buttonVariant: "default",
      }}
    />
  );
}
```

If `props` is omitted, the block renders with its default values. If `uiBlockKey` does not match a registered block, nothing is rendered.

---

### Rendering a block directly by component

Import and use the block component like any other React component.

```tsx
import { Hero1 } from "ui-blocks";

export function LandingPage() {
  return (
    <Hero1
      title="Grand Resort"
      subtitle="Luxury redefined."
      buttonText="Book Now"
      buttonVariant="outline"
    />
  );
}
```

All props are optional — omit any to fall back to the block's defaults.

---

### Rendering the block gallery

`UIBlockGallery` displays all registered blocks as a scaled grid. Pass an `onPreview` callback to handle clicks.

```tsx
"use client";

import { useRouter } from "next/navigation";
import { UIBlockGallery, type UiBlockMeta } from "ui-blocks";

export default function BlocksPage() {
  const router = useRouter();

  function handlePreview(block: UiBlockMeta) {
    router.push(`/blocks/${block.key}`);
  }

  return <UIBlockGallery onPreview={handlePreview} />;
}
```

---

### Rendering the full preview page

`UIBlockPreviewPage` renders a full-screen preview with viewport toggles (mobile / tablet / laptop) and a live edit panel.

```tsx
"use client";

import { useParams } from "next/navigation";
import { UIBlockPreviewPage } from "ui-blocks";

export default function BlockPreviewRoute() {
  const { blockKey } = useParams<{ blockKey: string }>();
  return <UIBlockPreviewPage uiBlockKey={blockKey} />;
}
```

---

### Accessing the registry programmatically

Use `UI_BLOCKS_INDEX` to query metadata for all registered blocks.

```tsx
import { UI_BLOCKS_INDEX, UI_BLOCK_CATEGORIES } from "ui-blocks";

// All blocks
console.log(UI_BLOCKS_INDEX);
// [{ key: "hero1", name: "Hero 1", category: "Hero", ... }, ...]

// All unique categories
console.log(UI_BLOCK_CATEGORIES);
// ["Hero", ...]

// Find a specific block
const block = UI_BLOCKS_INDEX.find((b) => b.key === "hero1");

// Read its schema (prop definitions)
console.log(block?.schema.props);

// Read its defaults
console.log(block?.defaults);
```

---

### Tailwind CSS setup

The package ships Tailwind class names but does **not** include a Tailwind stylesheet. Your application must include Tailwind and add the `ui-blocks` source to its content paths so the classes are generated.

```js
// tailwind.config.js (v3)
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui-blocks/src/**/*.{ts,tsx}", // ← add this
  ],
};
```

```ts
// tailwind.config.ts (v4 — CSS-based)
// In your global CSS @source directive:
// @source "../../packages/ui-blocks/src";
```
