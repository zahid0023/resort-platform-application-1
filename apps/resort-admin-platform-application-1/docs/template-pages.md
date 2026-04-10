# Template Pages

## Overview

A **Template Page** is a page slot within a Template. Each template page binds a **Page Type** (the classification of what the page is) to a concrete page instance with a display name, URL slug, and display order. Template pages define the navigational structure of a resort website template.

**Hierarchy:**
```
Template
  └── TemplatePage  (page_type_id → PageType)
        ├── page_name    — display name shown in navigation (e.g. "Our Rooms")
        ├── page_slug    — URL segment (e.g. "rooms")
        ├── page_order   — position in the template's page list
        └── TemplatePageSlot[]
              └── TemplatePageSlotVariant[]
```

---

## Data Model

### `TemplatePageSummary` (list view)

Returned by the list endpoint and used throughout the detail page UI.

| Field          | Type     | Description                                      |
|----------------|----------|--------------------------------------------------|
| `id`           | `number` | Auto-generated primary key                       |
| `template_id`  | `number` | Parent template reference                        |
| `page_type_id` | `number` | Foreign key to a PageType                        |
| `page_name`    | `string` | Human-readable page name (e.g. `"Our Rooms"`)    |
| `page_slug`    | `string` | URL-safe path segment (e.g. `"rooms"`)           |
| `page_order`   | `number` | Display/navigation order within the template     |

### `TemplatePage` (full — single fetch)

Extends the summary with slot data:

| Field                  | Type                  | Description                              |
|------------------------|-----------------------|------------------------------------------|
| `id`                   | `number`              | Primary key                              |
| `template_id`          | `number`              | Parent template                          |
| `page_type_id`         | `number`              | PageType reference                       |
| `page_name`            | `string`              |                                          |
| `page_slug`            | `string`              |                                          |
| `page_order`           | `number`              |                                          |
| `template_page_slots`  | `TemplatePageSlot[]`  | UI block slots defined for this page     |

### `TemplatePageSlot`

| Field                          | Type                        | Description                                     |
|--------------------------------|-----------------------------|-------------------------------------------------|
| `id`                           | `number`                    |                                                 |
| `template_page_id`             | `number`                    | Parent template page                            |
| `ui_block_category_id`         | `number`                    | UI block category this slot accepts             |
| `slot_name`                    | `string`                    | Label for the slot (e.g. `"hero"`, `"gallery"`) |
| `is_required`                  | `boolean`                   | Whether the slot must be filled                 |
| `slot_order`                   | `number`                    | Display order among slots on the page           |
| `template_page_slot_variants`  | `TemplatePageSlotVariant[]` | Variant options for the slot                    |

### `TemplatePageSlotVariant`

| Field                    | Type     | Description              |
|--------------------------|----------|--------------------------|
| `id`                     | `number` |                          |
| `template_page_slot_id`  | `number` | Parent slot reference    |
| `...`                    | `unknown`| Additional dynamic fields|

---

## API Endpoints

All endpoints are scoped under a parent template: `/templates/{templateId}/template-pages`.

### List Template Pages

```
GET /templates/{templateId}/template-pages
```

**Query parameters:**

| Param      | Type                                          | Default | Description               |
|------------|-----------------------------------------------|---------|---------------------------|
| `page`     | `number`                                      | `0`     | Zero-based page index     |
| `size`     | `number`                                      | —       | Items per page            |
| `sort_by`  | `"id" \| "pageName" \| "pageSlug" \| "pageOrder"` | —   | Sort field                |
| `sort_dir` | `"ASC" \| "DESC"`                             | —       | Sort direction            |

**Response: `TemplatePageListResponse`**

```ts
{
  data: TemplatePageSummary[]
  current_page: number      // zero-based
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}
```

---

### Get Template Page

```
GET /templates/{templateId}/template-pages/{id}
```

**Response:**

```ts
{ data: TemplatePage }
```

Returns the full page including `template_page_slots` and their variants.

---

### Create Template Page

```
POST /templates/{templateId}/template-pages
```

**Request body: `CreateTemplatePageRequest`**

```ts
{
  page_type_id: number   // required — must be unique within the template
  page_name: string      // required
  page_slug: string      // required — URL-safe
  page_order: number     // required
}
```

**Response: `MutationResponse`**

```ts
{ success: boolean; id: number }
```

---

### Update Template Page

```
PUT /templates/{templateId}/template-pages/{id}
```

**Request body: `UpdateTemplatePageRequest`** (all fields optional)

```ts
{
  page_type_id?: number
  page_name?: string
  page_slug?: string
  page_order?: number
}
```

**Response:**

```ts
{ data: TemplatePage }
```

> **Note:** `page_type_id` is intentionally not exposed in the Edit UI — only `page_name`, `page_slug`, and `page_order` can be changed after creation.

---

### Delete Template Page

```
DELETE /templates/{templateId}/template-pages/{id}
```

**Response: `MutationResponse`**

```ts
{ success: boolean; id: number }
```

---

## Service Layer

**File:** `src/services/template-pages.ts`

```ts
import {
  listTemplatePages,
  getTemplatePage,
  createTemplatePage,
  updateTemplatePage,
  deleteTemplatePage,
} from "@/services/template-pages"
```

| Function               | Signature                                                                                    |
|------------------------|----------------------------------------------------------------------------------------------|
| `listTemplatePages`    | `(templateId: number, params?: ListParams) => Promise<TemplatePageListResponse>`             |
| `getTemplatePage`      | `(templateId: number, id: number) => Promise<{ data: TemplatePage }>`                        |
| `createTemplatePage`   | `(templateId: number, body: CreateTemplatePageRequest) => Promise<MutationResponse>`         |
| `updateTemplatePage`   | `(templateId: number, id: number, body: UpdateTemplatePageRequest) => Promise<{ data: TemplatePage }>` |
| `deleteTemplatePage`   | `(templateId: number, id: number) => Promise<MutationResponse>`                              |

---

## UI

### Route

Template pages are managed inside the template detail page:

```
/templates/[id]
```

**File:** `src/app/(protected)/(portal)/templates/[id]/page.tsx`

---

### Template Detail Page: `TemplateDetailPage`

On load, fires three parallel requests:

| Call                                                              | Purpose                                              |
|-------------------------------------------------------------------|------------------------------------------------------|
| `getTemplate(templateId)`                                         | Template header info (name, key, status, description)|
| `listTemplatePages(templateId, { size: 100, sort_by: "pageOrder", sort_dir: "ASC" })` | Ordered list of this template's pages |
| `listPageTypes({ size: 100, sort_by: "name", sort_dir: "ASC" })` | All page types — used to display type name on each page card |

Pages are sorted client-side by `page_order` ascending and displayed as a list of cards.

**Interactions:**

| Action     | Trigger                    | Behavior                                                                                   |
|------------|----------------------------|--------------------------------------------------------------------------------------------|
| Add page   | "Add Page" button          | Opens `TemplatePageDialog` in add mode; `defaultOrder` is pre-computed as `max(page_order) + 1` |
| Edit page  | Pencil icon on a page row  | Sets `editingPage`, opens `TemplatePageDialog` in edit mode                                |
| Delete page| Trash icon on a page row   | Two-step confirm ("Sure?"), calls `deleteTemplatePage`, re-fetches data                    |

**Uniqueness enforcement:** `usedPageTypeIds` is derived from the current pages list and passed to the add/edit dialogs to filter the page type dropdown.

---

### Component: `TemplatePageCard`

**File:** `src/components/template-pages/template-page-card.tsx`

Standalone card used for rendering a single template page. Displays:

- **Icon** — `FileStackIcon` in a primary-tinted rounded square
- **Page name** — bold, truncated
- **Slug** — monospace, muted (`/rooms`)
- **Metadata row** — Template ID · Page Type ID · Order
- **Actions** — edit pencil + delete trash (two-step confirm)

**Props:**

```ts
interface TemplatePageCardProps {
  data: TemplatePageSummary
  onEdit: (data: TemplatePageSummary) => void
  onDelete: (id: number) => Promise<void>
}
```

> The detail page (`[id]/page.tsx`) renders page rows inline rather than using `TemplatePageCard` directly, but uses the same data shape.

---

### Component: `TemplatePageDialog`

**File:** `src/components/template-pages/template-page-dialog.tsx`

Modal dialog used for both **adding** and **editing** template pages. Behavior differs by mode:

**Props:**

```ts
interface TemplatePageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: number
  usedPageTypeIds: number[]      // page_type_ids already used in this template
  editing: TemplatePageBase | null  // null = add mode, object = edit mode
  onSuccess: () => void
  defaultOrder?: number          // pre-fills page_order in add mode
}
```

#### Add Mode (`editing={null}`)

| Field        | Input    | Behaviour                                                              |
|--------------|----------|------------------------------------------------------------------------|
| Page Type    | `select` | Fetches all page types via `GET /page-types`; excludes already-used types via `usedPageTypeIds` filter |
| Page Name    | `input`  | Free text; auto-generates slug until slug is manually edited           |
| Page Slug    | `input`  | Auto-synced from page name (`"Our Rooms"` → `"our-rooms"`); sync stops once manually edited |
| Page Order   | `input`  | Pre-filled with `defaultOrder` (max existing order + 1, or 1 if no pages) |

Calls `createTemplatePage(templateId, payload)` on submit.

#### Edit Mode (`editing={TemplatePageBase}`)

| Field      | Input   | Behaviour                                                   |
|------------|---------|-------------------------------------------------------------|
| Page Type  | hidden  | Not shown — page type is fixed after creation               |
| Page Name  | `input` | Pre-filled with `editing.page_name`; slug is locked         |
| Page Slug  | `input` | Pre-filled with `editing.page_slug`                         |
| Page Order | `input` | Pre-filled with `editing.page_order`                        |

Calls `updateTemplatePage(templateId, editing.id, payload)` on submit. The `page_type_id` field is intentionally excluded from the edit UI but is still sent in the payload with the original value.

#### Auto-slug logic

```
page_name change  →  slug = toSlug(name)   (while slugTouched === false)
page_slug change  →  slugTouched = true     (slug no longer syncs)
```

`toSlug`: lowercases, replaces spaces with `-`, strips non-alphanumeric characters.

#### On open

- Fetches `GET /page-types?size=100&sort_by=name&sort_dir=ASC` to populate the page type dropdown (add mode only).
- Initialises form fields from `editing` (edit mode) or `defaultOrder` + empty (add mode).

---

## Key Constraints

| Constraint | Where enforced |
|---|---|
| Each page type can only appear once per template | `usedPageTypeIds` filter in both add dialog and edit dialog dropdown |
| Page type cannot be changed after creation | Page type select is hidden in edit mode |
| `page_slug` must be URL-safe | `toSlug()` helper + manual validation by user |
| `page_order` is auto-suggested | Computed as `max(existing orders) + 1` when opening add dialog |
