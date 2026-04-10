# Page Types

## Overview

A **Page Type** is a reusable classification that defines what kind of content a page represents (e.g. Landing, Rooms, Events, Dining). Page Types act as the "blueprint label" — they do not contain content themselves, but they are assigned to pages within Templates to describe what that page slot is for.

---

## Data Model

### `PageType` (full)

| Field         | Type            | Required | Description                                      |
|---------------|-----------------|----------|--------------------------------------------------|
| `id`          | `number`        | yes      | Auto-generated numeric primary key               |
| `key`         | `string`        | yes      | Unique uppercase identifier (e.g. `LANDING`, `ROOMS`) |
| `name`        | `string`        | yes      | Human-readable display name (e.g. `Landing Page`) |
| `description` | `string \| null`| no       | Optional free-text description of the page type  |

### `PageTypeSummary` (list view)

A lighter shape returned in list and relation endpoints:

| Field         | Type                    |
|---------------|-------------------------|
| `id`          | `number`                |
| `key`         | `string`                |
| `name`        | `string`                |
| `description` | `string \| null \| undefined` |

---

## API Endpoints

All endpoints are prefixed by the base API URL configured in `src/services/api.ts`.

### List Page Types

```
GET /page-types
```

**Query parameters:**

| Param      | Type                        | Default | Description                  |
|------------|-----------------------------|---------|------------------------------|
| `page`     | `number`                    | `0`     | Zero-based page index        |
| `size`     | `number`                    | —       | Number of items per page     |
| `sort_by`  | `"id" \| "key" \| "name"`  | —       | Field to sort by             |
| `sort_dir` | `"ASC" \| "DESC"`           | —       | Sort direction               |

**Response: `PageTypeListResponse`**

```ts
{
  data: PageTypeSummary[]
  current_page: number     // zero-based
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}
```

---

### Get Page Type

```
GET /page-types/:id
```

**Response:**

```ts
{ data: PageType }
```

---

### Create Page Type

```
POST /page-types
```

**Request body: `CreatePageTypeRequest`**

```ts
{
  key: string           // required — unique, e.g. "LANDING"
  name: string          // required — display name
  description?: string  // optional
}
```

**Response: `MutationResponse`**

```ts
{ success: boolean; id: number }
```

---

### Update Page Type

```
PUT /page-types/:id
```

**Request body: `UpdatePageTypeRequest`** (all fields optional)

```ts
{
  key?: string
  name?: string
  description?: string
}
```

**Response:**

```ts
{ data: PageType }
```

---

### Delete Page Type

```
DELETE /page-types/:id
```

**Response: `MutationResponse`**

```ts
{ success: boolean; id: number }
```

---

## Service Layer

**File:** `src/services/page-types.ts`

```ts
import { listPageTypes, getPageType, createPageType, updatePageType, deletePageType } from "@/services/page-types"
```

| Function            | Signature                                                              |
|---------------------|------------------------------------------------------------------------|
| `listPageTypes`     | `(params?: ListParams) => Promise<PageTypeListResponse>`               |
| `getPageType`       | `(id: number) => Promise<{ data: PageType }>`                          |
| `createPageType`    | `(body: CreatePageTypeRequest) => Promise<MutationResponse>`           |
| `updatePageType`    | `(id: number, body: UpdatePageTypeRequest) => Promise<{ data: PageType }>` |
| `deletePageType`    | `(id: number) => Promise<MutationResponse>`                            |

---

## UI

### Route

```
/page-types
```

Accessible from the sidebar under "Page Types" (`FileTextIcon`).

### Page: `PageTypesPage`

**File:** `src/app/(protected)/(portal)/page-types/page.tsx`

Renders a paginated grid of `PageTypeCard` components (10 per page, sorted by `id ASC`).

**Interactions:**

| Action        | Trigger                           | Behavior                                                                  |
|---------------|-----------------------------------|---------------------------------------------------------------------------|
| Create        | "New Page Type" button (header)   | Opens `PageTypeDialog` in create mode                                     |
| Edit          | Pencil icon on a card             | Fetches full `PageType` via `getPageType`, opens dialog in edit mode      |
| Delete        | Trash icon on a card              | Two-step confirm ("Sure?" prompt), calls `deletePageType`, refreshes list |
| Paginate      | Prev / Next chevron buttons       | Updates `page` state, re-fetches list                                     |

### Component: `PageTypeCard`

**File:** `src/components/page-types/page-type-card.tsx`

Displays a single page type. Layout:

- **Icon** — `FileTextIcon` in a primary-tinted rounded square
- **Name** — bold, truncated
- **Key** — monospace, muted, below name
- **Description** — optional, shown below in muted text (max 2 lines)
- **Actions** — edit pencil + delete trash (with two-step delete confirmation)

**Props:**

```ts
interface PageTypeCardProps {
  data: PageTypeSummary
  onEdit: (data: PageTypeSummary) => void
  onDelete: (id: number) => Promise<void>
}
```

### Component: `PageTypeDialog`

**File:** `src/components/page-types/page-type-dialog.tsx`

Modal dialog used for both creating and editing a page type.

**Props:**

```ts
interface PageTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: PageType | null   // null = create mode, PageType = edit mode
  onSuccess: () => void
}
```

**Fields:**

| Field         | Input type  | Required | Max length | Notes                              |
|---------------|-------------|----------|------------|------------------------------------|
| `key`         | text        | yes      | 100        | e.g. `LANDING`, `ROOMS`            |
| `name`        | text        | yes      | 100        | e.g. `Landing Page`                |
| `description` | textarea    | no       | —          | Omitted from payload if empty      |

On submit, calls `createPageType` or `updatePageType` depending on whether `editing` is set. On success, calls `onSuccess()` and closes the dialog. Errors are surfaced via `sonner` toasts.

---

## Relationship to Templates

Page Types are the building block for **Template Pages** — they define what kind of page each slot in a template represents.

```
Template
  └── TemplatePage (page_type_id → PageType)
        ├── page_name   — display name for this instance (e.g. "Our Rooms")
        ├── page_slug   — URL segment (e.g. "rooms")
        └── page_order  — position in the navigation/template
```

**Constraints enforced in the UI:**

- Each page type can only appear **once per template**. When adding or editing a template page, already-used page types are excluded from the dropdown (except for the one being currently edited).
- The page type dropdown in `TemplatePageDialog` is populated via `listPageTypes({ size: 50, sort_by: "name", sort_dir: "ASC" })`.

**Where page types are consumed:**

| File | Usage |
|------|-------|
| `src/components/template-pages/template-page-dialog.tsx` | Dropdown to pick a page type when adding/editing a template page |
| `src/app/(protected)/(portal)/templates/[id]/page.tsx` | Loads all page types to build a `Map<id, PageTypeSummary>` for displaying the type name next to each template page |

---

## Key Conventions

- **`key` field** — intended to be a short, uppercase, snake-case-friendly identifier. Used as a stable reference that won't change even if the display `name` is updated. Examples: `LANDING`, `ROOMS`, `EVENTS`, `DINING`, `CONTACT`.
- **Uniqueness** — `key` is unique across the system. Attempting to create two page types with the same key will be rejected by the API.
- **Deletion** — deleting a page type that is actively referenced by template pages may fail at the API level. Always verify no templates are using the type before deleting.
