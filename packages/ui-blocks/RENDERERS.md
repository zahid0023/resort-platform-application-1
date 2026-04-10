# UI-Blocks Renderer System

This document covers all four renderers exported from the `ui-blocks` package, their props, data types, rendering behaviour, and usage patterns.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Model](#2-data-model)
3. [UIBlockRenderer](#3-uiblockrenderer)
4. [TemplatePageBlockSlotRenderer](#4-templatepageblockslotrenderer)
5. [TemplatePageRenderer](#5-templatepagerenderer)
6. [TemplateRenderer](#6-templaterenderer)
7. [Connecting API Data to Renderer Types](#7-connecting-api-data-to-renderer-types)
8. [Full End-to-End Example](#8-full-end-to-end-example)

---

## 1. Architecture Overview

The renderer system is a **layered composition** of four components. Each layer wraps the one below it:

```
TemplateRenderer
  └── TemplatePageRenderer          (one per page)
        └── TemplatePageBlockSlotRenderer   (one per slot)
              └── UIBlockRenderer           (one per active variant)
```

Each layer is independently importable. You can use any renderer in isolation — you do not have to use the full stack.

```
┌─────────────────────────────────────────────────────┐
│  TemplateRenderer                                   │
│  • Receives the full template tree                  │
│  • Sorts pages by page_order                        │
│  • Optional: filter to a single page via currentSlug│
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  TemplatePageRenderer  (per page)             │  │
│  │  • Sorts slots by slot_order                  │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  TemplatePageBlockSlotRenderer (per slot)│  │  │
│  │  │  • Picks the active variant             │  │  │
│  │  │    (is_default, else lowest order)      │  │  │
│  │  │                                         │  │  │
│  │  │  ┌───────────────────────────────────┐  │  │  │
│  │  │  │  UIBlockRenderer                  │  │  │  │
│  │  │  │  • Looks up block in registry     │  │  │  │
│  │  │  │  • Merges defaults with props     │  │  │  │
│  │  │  │  • Renders React component        │  │  │  │
│  │  │  └───────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 2. Data Model

### How the pieces relate

The backend manages a hierarchy of entities. The renderers mirror this hierarchy using plain TypeScript interfaces — no backend SDK is imported into the `ui-blocks` package.

```
Template
  id, key, name
  └── pages: TemplatePageData[]
        id, page_name, page_slug, page_order
        └── slots: TemplatePageBlockSlotData[]
              id, slot_name, slot_order, is_required
              └── variants: SlotVariant[]
                    id, ui_block_key, display_order, is_default, props?
                          │
                          └──► UI_BLOCKS_INDEX.find(b => b.key === ui_block_key)
                                    └──► React component rendered with merged defaults + props
```

### Type definitions (exported from `ui-blocks`)

```typescript
// Lowest level — a single UI block variant assigned to a slot
interface SlotVariant {
  id:            number;
  ui_block_key:  string;                    // e.g. "hero1", "gallery1"
  display_order: number;                    // ordering among variants in the slot
  is_default:    boolean;                   // which variant renders by default
  props?:        Record<string, unknown>;   // prop overrides applied on top of block defaults
}

// A named content slot inside a page
interface TemplatePageBlockSlotData {
  id:          number;
  slot_name:   string;    // e.g. "Hero Section", "Gallery"
  slot_order:  number;    // vertical ordering on the page
  is_required: boolean;
  variants:    SlotVariant[];
}

// A page inside a template
interface TemplatePageData {
  id:         number;
  page_name:  string;   // e.g. "Landing Page"
  page_slug:  string;   // e.g. "landing"
  page_order: number;   // ordering within the template
  slots:      TemplatePageBlockSlotData[];
}

// The root template
interface TemplateData {
  id:    number;
  key:   string;   // e.g. "resort-template-1"
  name:  string;   // e.g. "Resort Template 1"
  pages: TemplatePageData[];
}
```

> **Important — `ui_block_key` resolution**
>
> The backend stores `ui_block_definition_id` (a numeric foreign key) on each variant, not the string key. Before passing data to any renderer, your application must resolve the definition ID to the corresponding `ui_block_key` string. See [Section 7](#7-connecting-api-data-to-renderer-types) for a worked example.

---

## 3. UIBlockRenderer

**File:** `packages/ui-blocks/src/components/ui-block-renderer/index.tsx`
**Export:** `UIBlockRenderer`

### Purpose

The foundation of the rendering system. Given a `uiBlockKey` string, it:

1. Looks the block up in `UI_BLOCKS_INDEX` (the global registry).
2. Merges the block's registered `defaults` with any `props` you supply (your props win).
3. Renders the block's React component inside a wrapping `<div>`.

If the key does not match any registered block the renderer returns `null` — it never throws.

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `uiBlockKey` | `string` | Yes | The key registered in `UI_BLOCKS_INDEX`. Must exactly match a block's `schema.json` `key` field, e.g. `"hero1"`, `"gallery1"`. |
| `props` | `Record<string, unknown>` | No | Prop overrides applied on top of the block's registered defaults. Only include the props you want to override. |
| `className` | `string` | No | CSS class applied to the outer `<div>` wrapper. |

### Prop merging behaviour

```
final props = { ...block.defaults, ...props }
```

The block always has a valid state. Passing no `props` at all renders the block with its author-defined defaults.

### Examples

**Render with defaults only:**
```tsx
import { UIBlockRenderer } from "ui-blocks";

<UIBlockRenderer uiBlockKey="hero1" />
```

**Override specific props:**
```tsx
<UIBlockRenderer
  uiBlockKey="hero1"
  props={{
    title: "Book Your Stay",
    buttonText: "Reserve Now",
  }}
/>
```

**Custom wrapper class:**
```tsx
<UIBlockRenderer
  uiBlockKey="gallery1"
  className="my-8"
/>
```

**Unknown key — renders nothing:**
```tsx
<UIBlockRenderer uiBlockKey="does-not-exist" />
// → returns null, no error thrown
```

### How it connects to the registry

```typescript
// packages/ui-blocks/src/registry/index.tsx
export const UI_BLOCKS_INDEX: UiBlockMeta[] = [
  {
    key:       "hero1",
    component: Hero1,
    defaults:  { title: "Welcome to Our Resort", buttonText: "Book Now", ... },
    schema:    { ... },
    ...
  },
  // hero4, gallery1, gallery4 ...
];
```

Every block in the registry exposes:
- `key` — unique string identifier
- `component` — the React component to render
- `defaults` — baseline prop values
- `schema` — metadata about editable props (used by `UIBlockPreviewPage`)

---

## 4. TemplatePageBlockSlotRenderer

**File:** `packages/ui-blocks/src/components/template-page-block-slot-renderer/index.tsx`
**Exports:** `TemplatePageBlockSlotRenderer`, `TemplatePageBlockSlotData`, `SlotVariant`

### Purpose

Renders a single content slot from a template page. A slot can have multiple variants (different UI block choices for the same position). This renderer:

1. Receives the slot with all its variants.
2. Selects the **active variant** using the following priority:
   - First: the variant where `is_default === true`.
   - Fallback: the variant with the lowest `display_order`.
3. Passes the active variant's `ui_block_key` and `props` to `UIBlockRenderer`.
4. Returns `null` if the slot has no variants (never throws).

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `slot` | `TemplatePageBlockSlotData` | Yes | The slot to render, including its `variants` array. |
| `className` | `string` | No | CSS class applied to the outer `<div>` wrapper. |

### Variant selection logic

```
if (slot.variants is empty)  → return null

activeVariant =
  slot.variants.find(v => v.is_default)
  ?? [...slot.variants].sort by display_order ascending [0]
```

Only one variant is ever rendered at a time. The others are ignored during rendering (they exist as alternatives selectable in the admin).

### SlotVariant interface

```typescript
interface SlotVariant {
  id:            number;
  ui_block_key:  string;
  display_order: number;
  is_default:    boolean;
  props?:        Record<string, unknown>;
}
```

The `props` field on a variant lets you store prop overrides per-variant. This means two variants pointing at the same `ui_block_key` can render with completely different content.

### TemplatePageBlockSlotData interface

```typescript
interface TemplatePageBlockSlotData {
  id:          number;
  slot_name:   string;
  slot_order:  number;
  is_required: boolean;
  variants:    SlotVariant[];
}
```

### Examples

**Slot with a default variant:**
```tsx
import { TemplatePageBlockSlotRenderer } from "ui-blocks";

const slot = {
  id: 1,
  slot_name: "Hero Section",
  slot_order: 1,
  is_required: true,
  variants: [
    { id: 10, ui_block_key: "hero1", display_order: 1, is_default: false },
    { id: 11, ui_block_key: "hero4", display_order: 2, is_default: true },  // ← this renders
  ],
};

<TemplatePageBlockSlotRenderer slot={slot} />
// Renders Hero4 because is_default is true on variant id=11
```

**Slot with no explicit default — falls back to lowest display_order:**
```tsx
const slot = {
  id: 2,
  slot_name: "Gallery",
  slot_order: 2,
  is_required: false,
  variants: [
    { id: 20, ui_block_key: "gallery4", display_order: 2, is_default: false },
    { id: 21, ui_block_key: "gallery1", display_order: 1, is_default: false }, // ← this renders
  ],
};

<TemplatePageBlockSlotRenderer slot={slot} />
// Renders Gallery1 because it has the lowest display_order
```

**Slot with variant-level prop overrides:**
```tsx
const slot = {
  id: 3,
  slot_name: "Hero Section",
  slot_order: 1,
  is_required: true,
  variants: [
    {
      id: 30,
      ui_block_key: "hero1",
      display_order: 1,
      is_default: true,
      props: {
        title: "Summer Escape Package",
        buttonText: "Book Now — 20% Off",
      },
    },
  ],
};

<TemplatePageBlockSlotRenderer slot={slot} />
// Renders Hero1 with the custom title and button text
```

**Empty slot — renders nothing:**
```tsx
const slot = { id: 4, slot_name: "Optional Banner", slot_order: 3, is_required: false, variants: [] };

<TemplatePageBlockSlotRenderer slot={slot} />
// → returns null
```

---

## 5. TemplatePageRenderer

**File:** `packages/ui-blocks/src/components/template-page-renderer/index.tsx`
**Exports:** `TemplatePageRenderer`, `TemplatePageData`

### Purpose

Renders all slots in a single template page, in the correct vertical order. Internally it:

1. Receives a page with its `slots` array.
2. Sorts the slots by `slot_order` ascending (non-destructively — the original array is not mutated).
3. Renders each slot via `TemplatePageBlockSlotRenderer`.

Slots with no variants produce no output and do not affect layout.

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `page` | `TemplatePageData` | Yes | The page to render, including its sorted or unsorted `slots` array. |
| `className` | `string` | No | CSS class applied to the outer `<div>` wrapper. |

### TemplatePageData interface

```typescript
interface TemplatePageData {
  id:         number;
  page_name:  string;
  page_slug:  string;
  page_order: number;
  slots:      TemplatePageBlockSlotData[];
}
```

### Slot ordering

The renderer always sorts slots before rendering, regardless of the order they arrive in from the API:

```typescript
const sortedSlots = [...page.slots].sort((a, b) => a.slot_order - b.slot_order);
```

If two slots share the same `slot_order` their relative order is stable but undefined.

### Examples

**Basic usage:**
```tsx
import { TemplatePageRenderer } from "ui-blocks";

const page = {
  id: 1,
  page_name: "Landing Page",
  page_slug: "landing",
  page_order: 1,
  slots: [
    {
      id: 10,
      slot_name: "Hero Section",
      slot_order: 1,
      is_required: true,
      variants: [
        { id: 100, ui_block_key: "hero1", display_order: 1, is_default: true },
      ],
    },
    {
      id: 11,
      slot_name: "Gallery",
      slot_order: 2,
      is_required: false,
      variants: [
        { id: 101, ui_block_key: "gallery1", display_order: 1, is_default: true },
      ],
    },
  ],
};

<TemplatePageRenderer page={page} />
// Renders: Hero1 on top, Gallery1 below
```

**Custom wrapper class for spacing:**
```tsx
<TemplatePageRenderer page={page} className="flex flex-col gap-16" />
```

**Page with no slots — renders an empty div:**
```tsx
const emptyPage = { id: 2, page_name: "Blank", page_slug: "blank", page_order: 2, slots: [] };

<TemplatePageRenderer page={emptyPage} />
// → <div></div>
```

---

## 6. TemplateRenderer

**File:** `packages/ui-blocks/src/components/template-renderer/index.tsx`
**Exports:** `TemplateRenderer`, `TemplateData`

### Purpose

The top-level renderer. Renders a complete template — all of its pages and all of their slots. Internally it:

1. Receives a template with its `pages` array.
2. Sorts pages by `page_order` ascending (non-destructively).
3. If `currentSlug` is provided, filters to only the page whose `page_slug` matches.
4. Renders each qualifying page via `TemplatePageRenderer`.

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `template` | `TemplateData` | Yes | The full template tree to render. |
| `currentSlug` | `string` | No | When provided, only the page with `page_slug === currentSlug` is rendered. Use this to drive single-page rendering from a URL parameter. |
| `className` | `string` | No | CSS class applied to the outer `<div>` wrapper. |

### TemplateData interface

```typescript
interface TemplateData {
  id:    number;
  key:   string;
  name:  string;
  pages: TemplatePageData[];
}
```

### Page ordering and filtering

```typescript
const sortedPages = [...template.pages].sort((a, b) => a.page_order - b.page_order);

const pagesToRender = currentSlug
  ? sortedPages.filter(p => p.page_slug === currentSlug)
  : sortedPages;
```

If `currentSlug` matches no page, nothing is rendered. If `currentSlug` is omitted, every page is rendered in order — useful for full-template previews in the admin.

### Examples

**Render the entire template (all pages):**
```tsx
import { TemplateRenderer } from "ui-blocks";

<TemplateRenderer template={template} />
```

**Render only the page that matches the current URL slug:**
```tsx
// Next.js App Router example
// app/[templateKey]/[slug]/page.tsx

export default function Page({ params }: { params: { slug: string } }) {
  const template = /* fetch from API */;

  return <TemplateRenderer template={template} currentSlug={params.slug} />;
}
```

**Full-template preview with a wrapper class:**
```tsx
<TemplateRenderer template={template} className="min-h-screen bg-white" />
```

**Template with no pages — renders an empty div:**
```tsx
const emptyTemplate = { id: 1, key: "empty", name: "Empty", pages: [] };

<TemplateRenderer template={emptyTemplate} />
// → <div></div>
```

---

## 7. Connecting API Data to Renderer Types

The backend services (`template-pages.ts`, `template-page-slots.ts`, etc.) use numeric IDs throughout. The `ui-blocks` renderers use string keys. You must map between them before rendering.

### What the API returns vs. what the renderer needs

| API field | API type | Renderer field | Renderer type |
|---|---|---|---|
| `TemplatePageSlotVariant.ui_block_definition_id` | `number` | `SlotVariant.ui_block_key` | `string` |

The `ui_block_key` is stored on the `UiBlockDefinition` record in the backend. When fetching template data for rendering, include the definition's key in the response, or fetch definitions separately and build a lookup map.

### Example mapping function

```typescript
import type { TemplatePage } from "@/services/template-pages";
import type { TemplateData, TemplatePageData, TemplatePageBlockSlotData, SlotVariant } from "ui-blocks";

// Map returned by a definitions API call: { [id]: ui_block_key }
type DefinitionKeyMap = Record<number, string>;

function mapToTemplateData(
  template: { id: number; key: string; name: string },
  apiPages: TemplatePage[],
  definitionKeyMap: DefinitionKeyMap,
): TemplateData {
  const pages: TemplatePageData[] = apiPages.map((page) => {
    const slots: TemplatePageBlockSlotData[] = page.template_page_slots.map((slot) => {
      const variants: SlotVariant[] = slot.template_page_slot_variants.map((variant) => ({
        id:            variant.id,
        ui_block_key:  definitionKeyMap[variant.ui_block_definition_id] ?? "",
        display_order: variant.display_order,
        is_default:    variant.is_default,
      }));

      return {
        id:          slot.id,
        slot_name:   slot.slot_name,
        slot_order:  slot.slot_order,
        is_required: slot.is_required,
        variants,
      };
    });

    return {
      id:         page.id,
      page_name:  page.page_name,
      page_slug:  page.page_slug,
      page_order: page.page_order,
      slots,
    };
  });

  return { id: template.id, key: template.key, name: template.name, pages };
}
```

> If `definitionKeyMap` does not contain a given `ui_block_definition_id`, that variant's `ui_block_key` will be an empty string. `UIBlockRenderer` will silently return `null` for unrecognised keys, so the page continues to render without crashing.

---

## 8. Full End-to-End Example

Below is a complete, self-contained example of fetching a template and rendering it inside a Next.js page.

```tsx
// app/(resort)/[templateKey]/[[...slug]]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { TemplateRenderer, type TemplateData } from "ui-blocks";
import { getTemplate } from "@/services/templates";
import { listTemplatePages } from "@/services/template-pages";
import { listUiBlockDefinitions } from "@/services/ui-block-definitions";

interface Props {
  params: { templateKey: string; slug?: string[] };
}

export default function TemplatePage({ params }: Props) {
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const currentSlug = params.slug?.[0];

  useEffect(() => {
    async function load() {
      // 1. Fetch template + pages (with nested slots + variants)
      const { data: template } = await getTemplate(/* id from templateKey lookup */);
      const { data: pages } = await listTemplatePages(template.id);

      // 2. Build a map of definition id → ui_block_key
      const { data: definitions } = await listUiBlockDefinitions();
      const definitionKeyMap = Object.fromEntries(
        definitions.map((d) => [d.id, d.ui_block_key])
      );

      // 3. Map to TemplateData shape
      setTemplateData(mapToTemplateData(template, pages, definitionKeyMap));
    }

    load();
  }, []);

  if (!templateData) return null;

  return (
    <TemplateRenderer
      template={templateData}
      currentSlug={currentSlug}
      className="min-h-screen"
    />
  );
}
```

---

## Quick-reference: exports from `ui-blocks`

```typescript
// Components
import {
  UIBlockRenderer,                 // render a single UI block by key
  TemplatePageBlockSlotRenderer,   // render a single content slot
  TemplatePageRenderer,            // render all slots on a page
  TemplateRenderer,                // render an entire template
} from "ui-blocks";

// Types
import type {
  SlotVariant,                     // one variant option inside a slot
  TemplatePageBlockSlotData,       // a slot with its variants
  TemplatePageData,                // a page with its slots
  TemplateData,                    // a template with its pages
} from "ui-blocks";
```
