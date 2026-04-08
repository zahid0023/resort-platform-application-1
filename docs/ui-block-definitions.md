# UI Block Definitions

A **UI Block Definition** is the backend record that publishes a UI block to the system. It links a block to a page type and category, and stores its editable schema and default content.

---

## Overview

```
Preview Page  →  Review button  →  Approve  →  Approve Dialog  →  POST /ui-block-definitions
```

Definitions are created from the **admin app** (`resort-admin-platform-application-1`) on the block preview page.

---

## Review Button

Every block preview page has a **Review** button in the top-right header.

```
[Review ▾]
  ├── Approve  →  opens the Approve dialog
  └── Reject   →  closes the menu, does nothing
```

The Review button only appears when the `onApprove` callback prop is provided to `UIBlockPreviewPage`. This is wired up automatically in the admin app's preview route.

---

## Approve Dialog

### What happens on open

1. Fetches all page types — `GET /page-types`
2. Fetches all UI block categories — `GET /ui-block-categories`
3. Auto-fills fields from the block's `schema.json`

### Auto-fill and validation logic

Since `category`, `pageType`, and `allowedPages` are typed as enums (`UiBlockCategoryKey`, `PageTypeKey`, `AllowedPageKey`), their values in `schema.json` are **exact DB keys** — no fuzzy matching needed.

| `schema.json` field | Matched against DB | On match | On no match |
|---|---|---|---|
| `category` | `ui_block_category.key` (exact) | Category dropdown pre-selected | Warning shown, dropdown left empty |
| `pageType` | `page_type.key` (exact) | Page Type dropdown pre-selected | Warning shown, dropdown left empty |
| `allowedPages[n]` | `page_type.key` (exact) | Checkbox pre-checked | Warning shown, value excluded |

A mismatch at runtime means the enum in `registry/enums.ts` has a value that doesn't exist in the database yet — add the DB record or remove the enum value.

### Schema mismatch warnings

If any schema value has no database match, a yellow warning panel appears at the top of the dialog telling the block creator exactly what to fix:

```
⚠ schema.json mismatches — update the schema to fix these:
⚠ pageType: "LANDING" does not match any page_type.key in the database.
⚠ category: "Hero" does not match any ui_block_category.name or .key in the database.
⚠ allowedPages: "home" does not match any page_type.key in the database.
```

Inline hints also appear beneath the affected dropdowns. The dialog can still be submitted after manual correction — warnings do not block saving.

### Allowed Pages field

`allowedPages` is rendered as **checkboxes** populated from real DB page types. Only keys that exist in `page_type` are selectable. Values from `schema.allowedPages` that have no DB match are flagged with a warning and excluded from the checkboxes — the block creator must add the missing page type to the database or update `schema.json`.

### Dialog fields

| Field | Pre-filled from | Editable | Required |
|---|---|---|---|
| Page Type | `schema.pageType` → DB match | Yes | Yes |
| Category | `schema.category` → DB match | Yes | Yes |
| Name | `schema.name` | Yes | Yes |
| Description | `schema.description` | Yes | No |
| Version | `"1.0.0"` | Yes | Yes |
| Allowed Pages | `schema.allowedPages` (comma-separated) | Yes | No |
| Status | `"draft"` | Yes | Yes |

**Status options:** `draft` · `active` · `inactive`

---

## API Request

```
POST /api/v1/ui-block-definitions
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "ui_block_key":          "hero4",
  "name":                  "Hero 4",
  "description":           "A centered full-width hero with a badge, headline, and two buttons.",
  "ui_block_version":      "1.0.0",
  "page_type_id":          2,
  "ui_block_category_id":  1,
  "editable_schema":       { "...full schema.json object..." },
  "default_content":       { "...default.json object..." },
  "allowed_pages":         ["home", "landing"],
  "status":                "draft"
}
```

### Field reference

| Field | Source | Description |
|---|---|---|
| `ui_block_key` | `schema.key` | Unique block identifier, sent automatically from the registry |
| `name` | Dialog input | Editable copy of `schema.name` |
| `description` | Dialog input | Editable copy of `schema.description` |
| `ui_block_version` | Dialog input | Semantic version string |
| `page_type_id` | Dialog dropdown | Database ID of the selected page type |
| `ui_block_category_id` | Dialog dropdown | Database ID of the selected category |
| `editable_schema` | `schema` object | The full `schema.json` contents sent as-is |
| `default_content` | `defaults` object | The full `default.json` contents sent as-is |
| `allowed_pages` | Dialog input | Parsed from the comma-separated string input |
| `status` | Dialog dropdown | `draft` \| `active` \| `inactive` |

---

## Service Function

```ts
// apps/resort-admin-platform-application-1/src/services/ui-block-definitions.ts

import { api } from "./api";

export interface CreateUiBlockDefinitionRequest {
  ui_block_key: string;
  name: string;
  description: string;
  ui_block_version: string;
  ui_block_category_id: number;
  page_type_id: number;
  editable_schema: unknown;
  default_content: unknown;
  allowed_pages: string[];
  status: string;
}

export const createUiBlockDefinition = (
  body: CreateUiBlockDefinitionRequest
): Promise<{ success: boolean; id: number }> =>
  api.post("/ui-block-definitions", body);
```

The `api` client reads `NEXT_PUBLIC_API_URL` from `.env.local` and automatically attaches the Bearer token from `localStorage`.

---

## Related Services

| Service file | Functions | Endpoints |
|---|---|---|
| `services/page-types.ts` | `listPageTypes()` | `GET /page-types` |
| `services/ui-block-categories.ts` | `listUiBlockCategories()` | `GET /ui-block-categories` |
| `services/ui-block-definitions.ts` | `createUiBlockDefinition()` | `POST /ui-block-definitions` |

---

## File Locations

| File | Purpose |
|---|---|
| `packages/ui-blocks/src/components/ui-block-preview-page/index.tsx` | Preview page with Review button |
| `apps/resort-admin-platform-application-1/src/app/(protected)/(preview)/ui-blocks/[uiBlockKey]/page.tsx` | Admin route — wires up the approve dialog |
| `apps/resort-admin-platform-application-1/src/components/ui-blocks/approve-ui-block-dialog.tsx` | Approve dialog component |
| `apps/resort-admin-platform-application-1/src/services/ui-block-definitions.ts` | API service |

---

## Database Prerequisites

Before a block can be approved, these records must exist:

- **`ui_block_category`** — with a `name` or `key` matching `schema.category`
- **`page_type`** — with a `key` matching `schema.pageType`

Manage these in the admin app under **UI Block Categories** and **Page Types**.
