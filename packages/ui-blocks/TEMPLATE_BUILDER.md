# Template Website Builder — Full System Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Concepts & Terminology](#2-concepts--terminology)
3. [System Architecture](#3-system-architecture)
4. [packages/ui-blocks — Source of Truth](#4-packagesui-blocks--source-of-truth)
   - 4.1 [Directory Structure](#41-directory-structure)
   - 4.2 [Adding a New Block](#42-adding-a-new-block)
   - 4.3 [Registry & Enums](#43-registry--enums)
   - 4.4 [Page Section Map](#44-page-section-map)
5. [Database Schema](#5-database-schema)
6. [Admin Application — Pages](#6-admin-application--pages)
   - 6.1 [UI Block Gallery](#61-ui-block-gallery-ui-blocks)
   - 6.2 [Template List](#62-template-list-templates)
   - 6.3 [Template Builder](#63-template-builder-templatescreate--templatesidedit)
7. [Data Flow](#7-data-flow)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [File Locations Reference](#9-file-locations-reference)

---

## 1. Overview

The **Template Website Builder** lets an admin compose website templates for resorts.
A template defines the full visual structure of a resort's public website: which pages exist,
which section layout is used on each page, and which UI block variant fills each section.

**Hierarchy:**

```
Template
  └── Page (landing, allrooms, contactus, aboutus, loginlogout)
        └── Section Slot (navbar, hero, featured-rooms, highlights, gallery, footer)
              └── Selected Block (hero1, hero4, gallery1, gallery4, ...)
                    └── Props Override (custom title, colors, text, ...)
```

---

## 2. Concepts & Terminology

| Term | Meaning |
|---|---|
| **Block** | A single reusable React component (e.g. `Hero1`, `Gallery4`). Defined in `packages/ui-blocks`. |
| **Block Key** | Unique string identifier for a block, e.g. `"hero1"`. Comes from `schema.json → key`. |
| **Category** | The section type a block belongs to (e.g. `"hero"`, `"gallery"`, `"navbar"`). A block can only fill a slot of its own category. |
| **Page Type** | One of the predefined page kinds: `landing`, `allrooms`, `contactus`, `aboutus`, `loginlogout`. |
| **Section Slot** | A named position within a page that expects a block of a specific category (e.g. the `hero` slot on the `landing` page). |
| **Allowed Pages** | The page types a block is eligible to appear on. Declared in `schema.json → allowedPages[]`. |
| **Template** | A named collection of page configurations, optionally linked to a resort. |
| **Props Override** | Custom prop values an admin sets for a block, stored as JSON, overriding the block's `default.json`. |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    packages/ui-blocks                       │
│                                                             │
│  hero/hero1/  hero/hero4/  gallery/gallery1/  gallery4/ ... │
│  each block: index.tsx  schema.json  default.json           │
│                                                             │
│  registry/index.tsx  → UI_BLOCKS_INDEX  (all blocks)        │
│  registry/enums.ts   → PAGE_TYPE_KEYS, CATEGORY_KEYS        │
│  registry/page-section-map.ts → PAGE_SECTION_MAP            │
└───────────────────────────┬─────────────────────────────────┘
                            │ imported by
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            apps/resort-admin-platform-application-1         │
│                                                             │
│  /ui-blocks          → Block Gallery page (frontend only)   │
│  /templates          → Template list                        │
│  /templates/create   → Template builder (multi-step)        │
│  /templates/[id]/edit→ Edit existing template               │
│                                                             │
│  services/templates.ts  → API calls to backend              │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database                              │
│                                                             │
│  template               template_page                       │
│  template_page_section                                      │
└─────────────────────────────────────────────────────────────┘
```

**Key principle:** `packages/ui-blocks` is the single source of truth for every block's
existence, props, and defaults. The database only stores **keys and overrides** — it never
duplicates the component code or schema.

---

## 4. packages/ui-blocks — Source of Truth

### 4.1 Directory Structure

```
packages/ui-blocks/src/
│
├── hero/
│   ├── hero1/
│   │   ├── index.tsx        ← React component
│   │   ├── schema.json      ← metadata + editable props
│   │   └── default.json     ← default prop values
│   └── hero4/
│       ├── index.tsx
│       ├── schema.json
│       └── default.json
│
├── gallery/
│   ├── gallery1/
│   └── gallery4/
│
├── navbar/                  ← to be added
│   ├── navbar1/
│   └── navbar2/
│
├── footer/                  ← to be added
│   └── footer1/
│
├── featured-rooms/          ← to be added
│   └── featured-rooms1/
│
├── highlights/              ← to be added
│   └── highlights1/
│
├── registry/
│   ├── index.tsx            ← UI_BLOCKS_INDEX array
│   ├── enums.ts             ← PAGE_TYPE_KEYS, UI_BLOCK_CATEGORY_KEYS
│   └── page-section-map.ts  ← PAGE_SECTION_MAP  (to be added)
│
└── index.ts                 ← public exports
```

### 4.2 Adding a New Block

Every new block must follow this exact pattern.

**Step 1 — Create the folder:**
```
packages/ui-blocks/src/<category>/<blockKey>/
```

**Step 2 — `schema.json`:**
```json
{
  "key": "navbar1",
  "name": "Navbar 1",
  "description": "A simple top navigation bar with logo and links.",
  "category": "navbar",
  "allowedPages": ["landing", "allrooms", "contactus", "aboutus", "loginlogout"],
  "props": [
    { "name": "logoText",    "type": "string", "label": "Logo Text" },
    { "name": "backgroundColor", "type": "color", "label": "Background Color" }
  ]
}
```

`category` must be a value that exists in `UI_BLOCK_CATEGORY_KEYS` (enums.ts).
`allowedPages` must be a subset of `PAGE_TYPE_KEYS` (enums.ts).

**Step 3 — `default.json`:**
```json
{
  "logoText": "My Resort",
  "backgroundColor": "#ffffff"
}
```
Every key here must match a prop `name` in `schema.json`.

**Step 4 — `index.tsx`:**
```tsx
import defaults from "./default.json";

export interface Navbar1Props {
  logoText?: string;
  backgroundColor?: string;
}

const Navbar1 = ({
  logoText = defaults.logoText,
  backgroundColor = defaults.backgroundColor,
}: Navbar1Props) => {
  return (
    <nav style={{ backgroundColor }} className="w-full px-6 py-4 flex items-center">
      <span className="font-bold text-xl">{logoText}</span>
    </nav>
  );
};

export default Navbar1;
```

**Step 5 — Register in `registry/index.tsx`:**
```tsx
import Navbar1 from "../navbar/navbar1";
import navbar1Schema from "../navbar/navbar1/schema.json";
import navbar1Defaults from "../navbar/navbar1/default.json";

// add to UI_BLOCKS_INDEX array:
{
  key: navbar1Schema.key,
  name: navbar1Schema.name,
  description: navbar1Schema.description,
  category: navbar1Schema.category as UiBlockCategoryKey,
  component: Navbar1 as ComponentType<Record<string, unknown>>,
  schema: navbar1Schema as UiBlockSchema,
  defaults: navbar1Defaults,
},
```

**Step 6 — Export from `index.ts`:**
```ts
export { default as Navbar1 } from "./navbar/navbar1";
```

### 4.3 Registry & Enums

**`registry/enums.ts`** — extend these as new categories and page types are added:

```ts
export const UI_BLOCK_CATEGORY_KEYS = [
  "hero",
  "gallery",
  "navbar",           // ← add
  "footer",           // ← add
  "featured-rooms",   // ← add
  "highlights",       // ← add
] as const;

export type UiBlockCategoryKey = (typeof UI_BLOCK_CATEGORY_KEYS)[number];

export const PAGE_TYPE_KEYS = [
  "landing",
  "allrooms",      // ← add
  "contactus",     // ← add
  "aboutus",       // ← add
  "loginlogout",   // ← add
] as const;

export type PageTypeKey = (typeof PAGE_TYPE_KEYS)[number];
export type AllowedPageKey = PageTypeKey;
```

> **Rule:** Adding a value here without a matching DB record in `page_type` / `ui_block_category`
> will cause a schema mismatch warning in the builder. Always add both together.

### 4.4 Page Section Map

Create `packages/ui-blocks/src/registry/page-section-map.ts`:

```ts
import type { PageTypeKey, UiBlockCategoryKey } from "./enums";

/**
 * Defines which section slots appear on each page type, and in what order.
 * Each value is a UiBlockCategoryKey — the builder shows blocks of that category
 * as options for that slot.
 */
export const PAGE_SECTION_MAP: Record<PageTypeKey, UiBlockCategoryKey[]> = {
  landing:     ["navbar", "hero", "featured-rooms", "highlights", "gallery", "footer"],
  allrooms:    ["navbar", "gallery", "footer"],
  contactus:   ["navbar", "footer"],
  aboutus:     ["navbar", "highlights", "footer"],
  loginlogout: ["navbar", "footer"],
};

export type PageSectionMap = typeof PAGE_SECTION_MAP;
```

This is the single place that controls which sections exist on each page.
It is imported by the admin Template Builder UI — no DB query needed.

---

## 5. Database Schema

```sql
-- ─────────────────────────────────────────────
-- Templates
-- ─────────────────────────────────────────────

CREATE TABLE template (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  resort_id   UUID REFERENCES resort(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'draft'  -- 'draft' | 'published'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- Pages within a template
-- ─────────────────────────────────────────────

CREATE TABLE template_page (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id    UUID NOT NULL REFERENCES template(id) ON DELETE CASCADE,
  page_type_key  TEXT NOT NULL,   -- must match PAGE_TYPE_KEYS in enums.ts
  sort_order     INT NOT NULL DEFAULT 0,
  UNIQUE (template_id, page_type_key)
);

-- ─────────────────────────────────────────────
-- Section slots within a page
-- ─────────────────────────────────────────────

CREATE TABLE template_page_section (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_page_id   UUID NOT NULL REFERENCES template_page(id) ON DELETE CASCADE,
  section_slot_key   TEXT NOT NULL,   -- matches UiBlockCategoryKey (e.g. "hero")
  selected_block_key TEXT,            -- matches UiBlockMeta.key (e.g. "hero1") — NULL = not yet chosen
  props_override     JSONB,           -- partial prop values overriding default.json
  sort_order         INT NOT NULL DEFAULT 0,
  UNIQUE (template_page_id, section_slot_key)
);
```

**Relationship summary:**
```
template (1) ──< template_page (many)
template_page (1) ──< template_page_section (many)
```

`selected_block_key` links to `UI_BLOCKS_INDEX[n].key` — no FK needed because
the source of truth is the code package, not a DB table.

---

## 6. Admin Application — Pages

### 6.1 UI Block Gallery (`/ui-blocks`)

**Purpose:** Browse every available UI block with a live preview and metadata.

**No API call needed** — reads entirely from `UI_BLOCKS_INDEX`.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  UI Block Library                      [Filter by type ▼]│
├──────────────────────────────────────────────────────────┤
│  HERO                                                    │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │   [Hero 1       │  │   [Hero 4       │               │
│  │    preview]     │  │    preview]     │               │
│  │─────────────────│  │─────────────────│               │
│  │ Hero 1          │  │ Hero 4          │               │
│  │ A card-style…   │  │ A centered…     │               │
│  │ Pages: landing  │  │ Pages: landing  │               │
│  └─────────────────┘  └─────────────────┘               │
│                                                          │
│  GALLERY                                                 │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │  [Gallery 1     │  │  [Gallery 4     │               │
│  │   preview]      │  │   preview]      │               │
│  └─────────────────┘  └─────────────────┘               │
└──────────────────────────────────────────────────────────┘
```

**Component structure:**
```
app/(protected)/(portal)/ui-blocks/
  page.tsx                    ← server component, no data fetch needed

components/ui-blocks/
  block-gallery.tsx           ← client component, reads UI_BLOCKS_INDEX
  block-gallery-card.tsx      ← single block card with live preview
  block-preview-frame.tsx     ← renders <BlockComponent {...defaults} /> in an iframe-like box
```

**block-gallery-card.tsx rendering logic:**
```tsx
import { UI_BLOCKS_INDEX } from "@repo/ui-blocks";

// For each block in UI_BLOCKS_INDEX:
const block = UI_BLOCKS_INDEX.find(b => b.key === "hero1");
const Component = block.component;
const preview = <Component {...block.defaults} />;
```

### 6.2 Template List (`/templates`)

**Purpose:** List all templates with status, resort link, and action buttons.

**API endpoints needed:**
- `GET /templates` → list all templates
- `DELETE /templates/:id` → delete template

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  Templates                              [+ New Template] │
├──────────────────────────────────────────────────────────┤
│  Name             Resort       Status     Actions        │
│  ─────────────    ──────────   ───────    ───────        │
│  Luxury Theme     Grand Vista  Published  [Edit][Delete] │
│  Summer Theme     —            Draft      [Edit][Delete] │
└──────────────────────────────────────────────────────────┘
```

### 6.3 Template Builder (`/templates/create` & `/templates/[id]/edit`)

**Purpose:** Multi-step wizard to compose a template.

**API endpoints needed:**
- `POST /templates` → create template
- `GET /templates/:id` → load full template with pages and sections
- `PATCH /templates/:id` → update name/description/status
- `PUT /templates/:id/pages` → replace all page+section config (bulk save)

---

**Step 1 — Basic Info**
```
┌────────────────────────────────────┐
│ Template Name  [________________]  │
│ Description    [________________]  │
│ Resort         [Select resort ▼ ]  │
│                          [Next →]  │
└────────────────────────────────────┘
```

---

**Step 2 — Configure Pages & Sections**

Left panel: page type tabs. Right panel: sections for the selected page.

```
┌──────────────────────────────────────────────────────────────┐
│ [Landing] [All Rooms] [Contact] [About] [Login/Logout]       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  NAVBAR SLOT                                                 │
│  ┌──────────┐  ┌──────────┐                                 │
│  │ Navbar 1 │  │ Navbar 2 │   ← blocks where category=navbar│
│  │ [select] │  │          │     and allowedPages ∋ "landing" │
│  └──────────┘  └──────────┘                                 │
│                                                              │
│  HERO SLOT                                                   │
│  ┌──────────┐  ┌──────────┐                                 │
│  │ Hero 1 ✓ │  │ Hero 4   │   ← category=hero               │
│  └──────────┘  └──────────┘                                 │
│                                                              │
│  FEATURED ROOMS SLOT                                         │
│  ┌──────────┐                                                │
│  │ FeatRm 1 │                                               │
│  └──────────┘                                               │
│                                                              │
│  [← Back]                                  [Next →]         │
└──────────────────────────────────────────────────────────────┘
```

**Block filtering logic (frontend, no API):**
```ts
// For a given page type and section slot:
function getBlockOptions(pageType: PageTypeKey, slotCategory: UiBlockCategoryKey) {
  return UI_BLOCKS_INDEX.filter(
    block =>
      block.category === slotCategory &&
      block.schema.allowedPages?.includes(pageType)
  );
}
```

---

**Step 2b — Props Override Panel (optional, Phase 2)**

When the admin clicks a block card, a side panel opens showing all editable props from `schema.json`:

```
┌─────────────────────────────────┐
│  Hero 1 — Edit Content          │
│                                 │
│  Title        [Welcome ______]  │  ← prop type: "string"
│  Subtitle     [Experience ___]  │  ← prop type: "string"
│  Button Text  [Book Now ______] │  ← prop type: "string"
│  Button Style [Default      ▼]  │  ← prop type: "select"
│  Background   [■ #ffffff     ]  │  ← prop type: "color"
│                                 │
│               [Apply Changes]   │
└─────────────────────────────────┘
```

Prop type → input mapping:
| `schema.json type` | Input rendered |
|---|---|
| `"string"` | `<Input type="text" />` |
| `"number"` | `<Input type="number" />` |
| `"boolean"` | `<Switch />` |
| `"select"` | `<Select>` with `options[]` |
| `"color"` | `<Input type="color" />` |

---

**Step 3 — Preview**

Renders all selected blocks in page order with the merged props
(`default.json` values overridden by `props_override`).

```
┌──────────────────────────────────────────────────────────────┐
│  Preview: Landing Page                                       │
│  [Landing ▼]                                                 │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [Navbar 1 rendered]                                   │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  [Hero 1 rendered with overrides]                      │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  [Featured Rooms 1 rendered]                           │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  [Footer 1 rendered]                                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [← Back]              [Save Draft]  [Publish Template]      │
└──────────────────────────────────────────────────────────────┘
```

**Rendering logic:**
```ts
// Merge default props with admin overrides
function resolveProps(blockKey: string, propsOverride: Record<string, unknown>) {
  const block = UI_BLOCKS_INDEX.find(b => b.key === blockKey);
  if (!block) return {};
  return { ...block.defaults, ...propsOverride };
}
```

---

## 7. Data Flow

### Creating a template (full round-trip)

```
Admin fills Step 1
    │
    ▼
POST /templates
  body: { name, description, resort_id }
  response: { id: "uuid-abc" }
    │
    ▼
Admin picks blocks in Step 2
(all selection state lives in React state — no API calls yet)
    │
    ▼
Admin clicks "Save Draft"
    │
    ▼
PUT /templates/uuid-abc/pages
  body: {
    pages: [
      {
        page_type_key: "landing",
        sort_order: 0,
        sections: [
          { section_slot_key: "navbar",  selected_block_key: "navbar1", props_override: {} },
          { section_slot_key: "hero",    selected_block_key: "hero1",   props_override: { title: "Custom Title" } },
          { section_slot_key: "footer",  selected_block_key: "footer1", props_override: {} }
        ]
      },
      {
        page_type_key: "allrooms",
        sort_order: 1,
        sections: [
          { section_slot_key: "navbar",  selected_block_key: "navbar1", props_override: {} },
          { section_slot_key: "gallery", selected_block_key: "gallery4", props_override: {} },
          { section_slot_key: "footer",  selected_block_key: "footer1", props_override: {} }
        ]
      }
    ]
  }
    │
    ▼
Server upserts template_page + template_page_section rows
    │
    ▼
Response: 200 OK
```

### Loading a template for editing

```
GET /templates/uuid-abc
  response: {
    id, name, description, resort_id, status,
    pages: [
      {
        id, page_type_key: "landing", sort_order: 0,
        sections: [
          { id, section_slot_key: "navbar",  selected_block_key: "navbar1",  props_override: {} },
          { id, section_slot_key: "hero",    selected_block_key: "hero1",    props_override: { title: "Custom" } },
          { id, section_slot_key: "footer",  selected_block_key: "footer1",  props_override: {} }
        ]
      }
    ]
  }
    │
    ▼
Frontend reconstructs state from response
Merges with PAGE_SECTION_MAP to know which slots exist but have no block selected yet
    │
    ▼
Admin edits → same PUT /templates/:id/pages flow
```

---

## 8. Implementation Roadmap

### Phase 1 — Foundation (do first)

| # | Task | File(s) |
|---|---|---|
| 1 | Extend enums with all page types and categories | `packages/ui-blocks/src/registry/enums.ts` |
| 2 | Create `PAGE_SECTION_MAP` | `packages/ui-blocks/src/registry/page-section-map.ts` |
| 3 | Export `PAGE_SECTION_MAP` from index | `packages/ui-blocks/src/index.ts` |
| 4 | Add stub blocks for missing categories (navbar1, footer1, featured-rooms1, highlights1) | `packages/ui-blocks/src/navbar/navbar1/` etc. |
| 5 | Register all new blocks in `registry/index.tsx` | `packages/ui-blocks/src/registry/index.tsx` |

### Phase 2 — UI Block Gallery

| # | Task | File(s) |
|---|---|---|
| 6 | Gallery page route | `apps/resort-admin-platform-application-1/src/app/(protected)/(portal)/ui-blocks/page.tsx` |
| 7 | BlockGallery client component | `apps/.../src/components/ui-blocks/block-gallery.tsx` |
| 8 | BlockGalleryCard component | `apps/.../src/components/ui-blocks/block-gallery-card.tsx` |

### Phase 3 — Database & Service

| # | Task | File(s) |
|---|---|---|
| 9 | DB migration: `template`, `template_page`, `template_page_section` | `migrations/` |
| 10 | Template service (CRUD + pages bulk upsert) | `apps/.../src/services/templates.ts` |

### Phase 4 — Template Builder UI

| # | Task | File(s) |
|---|---|---|
| 11 | Template list page | `apps/.../app/(protected)/(portal)/templates/page.tsx` |
| 12 | Template builder root | `apps/.../app/(protected)/(portal)/templates/create/page.tsx` |
| 13 | Step 1 — basic info form | `apps/.../src/components/templates/builder-step-info.tsx` |
| 14 | Step 2 — page/section configurator | `apps/.../src/components/templates/builder-step-pages.tsx` |
| 15 | Block option picker (per slot) | `apps/.../src/components/templates/block-slot-picker.tsx` |
| 16 | Step 3 — full preview | `apps/.../src/components/templates/builder-step-preview.tsx` |

### Phase 5 — Props Override (optional)

| # | Task | File(s) |
|---|---|---|
| 17 | Prop editor side panel | `apps/.../src/components/templates/block-props-editor.tsx` |
| 18 | Dynamic input renderer (string/select/color/boolean) | `apps/.../src/components/templates/prop-input.tsx` |

---

## 9. File Locations Reference

```
packages/ui-blocks/
  src/
    registry/
      enums.ts                  ← PAGE_TYPE_KEYS, UI_BLOCK_CATEGORY_KEYS
      index.tsx                 ← UI_BLOCKS_INDEX
      page-section-map.ts       ← PAGE_SECTION_MAP  [TO ADD]
    hero/
      hero1/  hero4/
    gallery/
      gallery1/  gallery4/
    navbar/                     [TO ADD]
      navbar1/  navbar2/
    footer/                     [TO ADD]
      footer1/
    featured-rooms/             [TO ADD]
      featured-rooms1/
    highlights/                 [TO ADD]
      highlights1/
    index.ts                    ← public package exports

apps/resort-admin-platform-application-1/src/
  app/(protected)/(portal)/
    ui-blocks/
      page.tsx                  [TO ADD] ← block gallery route
    templates/
      page.tsx                  [TO ADD] ← template list route
      create/
        page.tsx                [TO ADD] ← create template route
      [id]/
        edit/
          page.tsx              [TO ADD] ← edit template route
  components/
    ui-blocks/
      block-gallery.tsx         [TO ADD]
      block-gallery-card.tsx    [TO ADD]
    templates/
      builder-step-info.tsx     [TO ADD]
      builder-step-pages.tsx    [TO ADD]
      builder-step-preview.tsx  [TO ADD]
      block-slot-picker.tsx     [TO ADD]
      block-props-editor.tsx    [TO ADD — Phase 5]
      prop-input.tsx            [TO ADD — Phase 5]
  services/
    templates.ts                [TO ADD]
```

---

*Last updated: 2026-07-03*
