# Adding a New Block

Follow these steps to add a new UI block to the shared `ui-blocks` package.

---

## Step 1 — Create the Block Folder

Create a folder under the relevant category:

```
packages/ui-blocks/src/<category>/<variant>/
├── index.tsx       ← React component
├── schema.json     ← metadata, DB linkage, editable props
└── default.json    ← default prop values
```

**Example — adding `Hero5`:**

```
packages/ui-blocks/src/hero/hero5/
```

---

## Step 2 — Write `schema.json`

`schema.json` defines the block's identity, its database linkage, and which props are editable in the preview panel.

```json
{
  "key": "hero5",
  "name": "Hero 5",
  "description": "A full-width hero with a title and CTA button.",

  "category": "Hero",
  "pageType": "LANDING",
  "allowedPages": ["home", "landing"],

  "props": [
    { "name": "title",           "type": "string",  "label": "Title" },
    { "name": "subtitle",        "type": "string",  "label": "Subtitle" },
    { "name": "buttonText",      "type": "string",  "label": "Button Text" },
    { "name": "buttonVariant",   "type": "select",  "label": "Button Variant",
      "options": ["default", "outline", "secondary", "ghost"] },
    { "name": "showBadge",       "type": "boolean", "label": "Show Badge" },
    { "name": "backgroundColor", "type": "color",   "label": "Background Color" }
  ]
}
```

### Top-level fields

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Unique block identifier. Used in the URL, registry, and sent as `ui_block_key` to the API. Lowercase, no spaces. |
| `name` | `string` | Display name shown in the gallery and approve dialog. |
| `description` | `string` | Short description shown in the gallery and approve dialog. |
| `category` | `UiBlockCategoryKey` | Must be a value from `UI_BLOCK_CATEGORY_KEYS` in `registry/enums.ts` — matches `ui_block_category.key` exactly. TypeScript will error on invalid values. |
| `pageType` | `PageTypeKey` | Must be a value from `PAGE_TYPE_KEYS` in `registry/enums.ts` — matches `page_type.key` exactly. TypeScript will error on invalid values. |
| `allowedPages` | `AllowedPageKey[]` | Subset of `PAGE_TYPE_KEYS`. Each value must match a `page_type.key` exactly. TypeScript will error on invalid values. |
| `props` | `EditableProp[]` | Editable prop definitions (see below). |

### Adding new categories or page types

When the database gets a new `ui_block_category` or `page_type`, add its key to `packages/ui-blocks/src/registry/enums.ts`:

```ts
export const UI_BLOCK_CATEGORY_KEYS = [
  "hero",
  "pricing",   // ← add new ui_block_category.key here
] as const;

export const PAGE_TYPE_KEYS = [
  "LANDING",
  "ROOMS",     // ← add new page_type.key here
] as const;
```

Any `schema.json` using a value not in these arrays will fail to compile.

### Prop types

| `type` | Edit control rendered | Notes |
|---|---|---|
| `string` | Text input | Default for freeform text |
| `number` | Number input | |
| `boolean` | Checkbox | |
| `select` | Dropdown | Must include `"options": ["a", "b", ...]` |
| `color` | Color picker + hex text input | Value is a hex string e.g. `"#ffffff"` |

---

## Step 3 — Write `default.json`

Every key must match a `name` in `schema.json` props. These values are shown on first load in the preview.

```json
{
  "title": "Discover Paradise",
  "subtitle": "Experience luxury like never before.",
  "buttonText": "Book Now",
  "buttonVariant": "default",
  "showBadge": true,
  "backgroundColor": "#ffffff"
}
```

---

## Step 4 — Write `index.tsx`

```tsx
import { cn } from "@/lib/utils";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import defaults from "./default.json";

export interface Hero5Props {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost";
  showBadge?: boolean;
  backgroundColor?: string;
}

const Hero5 = ({
  title = defaults.title,
  subtitle = defaults.subtitle,
  buttonText = defaults.buttonText,
  buttonVariant = defaults.buttonVariant as Hero5Props["buttonVariant"],
  showBadge = defaults.showBadge,
  backgroundColor = defaults.backgroundColor,
}: Hero5Props) => {
  return (
    <div
      className={cn("flex w-full h-full flex-col items-center justify-center gap-6 py-12 text-center")}
      style={{ backgroundColor }}
    >
      {showBadge && <Badge variant="secondary">New</Badge>}
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-xl text-muted-foreground">{subtitle}</p>
      <Button variant={buttonVariant}>{buttonText}</Button>
    </div>
  );
};

export default Hero5;
```

> **Important:** `color` props must always be applied via `style={{ backgroundColor }}` — never passed to `cn()` as a class name. Hex values are not valid Tailwind class names and will have no effect if used that way.

---

## Step 5 — Register the Block

Open `packages/ui-blocks/src/registry/index.tsx` and add your block:

```tsx
import Hero5 from "../hero/hero5";
import hero5Schema from "../hero/hero5/schema.json";
import hero5Defaults from "../hero/hero5/default.json";

export const UI_BLOCKS_INDEX: UiBlockMeta[] = [
  // ... existing blocks
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

---

## Step 6 — Export from `index.ts`

Open `packages/ui-blocks/src/index.ts` and add a named export:

```ts
export { default as Hero5 } from "./hero/hero5";
```

---

## Naming Rules

| Category | Variant Pattern | Export Name |
|---|---|---|
| `hero` | `hero1`, `hero2`, `hero3`… | `Hero1`, `Hero2`, `Hero3`… |
| `pricing` | `pricing1`, `pricing2`… | `Pricing1`, `Pricing2`… |
| `features` | `features1`, `features2`… | `Features1`, `Features2`… |

Follow the same `<category><number>` pattern for any new category you introduce.

---

## Using shadcn/ui Primitives Inside a Block

The shadcn/ui components in `src/components/ui/` are available using the `@/` alias inside the package:

```tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
```

---

## Database Prerequisites

Before the block can be approved, the following records must exist in the database:

- **`ui_block_category`** — with a `name` or `key` matching `schema.category`
- **`page_type`** — with a `key` matching `schema.pageType`

These are managed in the admin app under **UI Block Categories** and **Page Types**.

---

## Checklist

```
[ ] Create index.tsx, schema.json, default.json
[ ] Set category, pageType, allowedPages in schema.json to match DB records
[ ] Register in registry/index.tsx
[ ] Export from index.ts
[ ] Open preview page — confirm props edit correctly in the panel
[ ] Confirm color props render via style, not className
[ ] Click Review → Approve — verify dropdowns auto-select correctly
[ ] Adjust any fields if needed, then click Approve & Save
```
