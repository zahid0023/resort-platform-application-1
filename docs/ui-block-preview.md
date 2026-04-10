# UI Block Preview

## Overview

`UiBlockPreview` is the single shared component responsible for rendering a scaled, non-interactive visual preview of any registered UI block. All parts of the admin platform that need to show a UI block thumbnail — the block gallery, the slot variant picker dialog, and the slot detail page — use this component so that preview appearance is controlled in one place.

---

## Architecture

```
packages/ui-blocks
  └── src/
      ├── registry/index.tsx          ← UI_BLOCKS_INDEX (key, component, defaults, …)
      └── components/
          └── ui-block-renderer/
              └── index.tsx           ← UIBlockRenderer (looks up key → renders component)

apps/resort-admin-platform-application-1
  └── src/components/ui-blocks/
      └── ui-block-preview.tsx        ← UiBlockPreview (scales UIBlockRenderer to fit a thumbnail)
```

### Rendering chain

```
uiBlockKey (string)
  → UIBlockRenderer          finds meta by key, renders <meta.component {...meta.defaults} />
    → UiBlockPreview         wraps in aspect-video container, applies scale transform
      → used by:
          /ui-blocks page            (block gallery cards)
          TemplatePageSlotVariantDialog  (definition picker cards)
          /templates/…/[slotId] page (variant cards)
```

---

## Component Reference

### `UiBlockPreview`

**File:** `src/components/ui-blocks/ui-block-preview.tsx`

```tsx
<UiBlockPreview uiBlockKey="hero.hero1" />
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `uiBlockKey` | `string` | Yes | The block's registry key (e.g. `"hero.hero1"`). Matches `UiBlockMeta.key` in `UI_BLOCKS_INDEX`. If the key is not found, nothing renders. |

**Rendering details:**
- Container: `relative w-full aspect-video overflow-hidden bg-white pointer-events-none`
  - `aspect-video` — maintains 16:9 ratio regardless of container width
  - `pointer-events-none` — preview is display-only; clicks pass through to parent
- Inner scaler: `absolute inset-0 w-[200%] origin-top-left scale-[0.5]`
  - Block renders at double the container width (`w-[200%]`) then scaled down 50% from the top-left corner — this produces a pixel-accurate miniature of the block at its natural desktop width

---

### `UIBlockRenderer` (package)

**File:** `packages/ui-blocks/src/components/ui-block-renderer/index.tsx`
**Export:** `"ui-blocks"` package

```tsx
<UIBlockRenderer uiBlockKey="hero.hero1" />
<UIBlockRenderer uiBlockKey="hero.hero1" props={{ title: "Custom title" }} />
<UIBlockRenderer uiBlockKey="hero.hero1" className="my-4" />
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `uiBlockKey` | `string` | Yes | Registry key of the block to render |
| `props` | `Record<string, unknown>` | No | Prop overrides merged on top of `meta.defaults` |
| `className` | `string` | No | Class applied to the wrapper `<div>` |

Returns `null` silently if the key is not registered.

---

## Where It Is Used

### 1. UI Blocks Gallery — `/ui-blocks`

**File:** `src/app/(protected)/(portal)/ui-blocks/page.tsx`

Each `BlockCard` shows a clickable preview thumbnail. Clicking navigates to the full-page block preview route.

```tsx
function BlockCard({ meta, onPreview, onApprove }) {
  return (
    <div className="flex flex-col rounded-xl border bg-card ring-1 ring-foreground/10 overflow-hidden">
      <div onClick={onPreview} className="overflow-hidden cursor-pointer …">
        <UiBlockPreview uiBlockKey={meta.key} />
      </div>
      {onApprove && (
        <div className="flex justify-end px-3 py-2 border-t bg-muted/30">
          <Button size="sm" onClick={onApprove}>Approve</Button>
        </div>
      )}
    </div>
  )
}
```

Cards are grouped into three tabs: **Not Reviewed**, **Accepted**, **Rejected** — based on whether a matching `UiBlockDefinition` with status `"Accepted"` exists in the API.

---

### 2. Slot Variant Picker Dialog

**File:** `src/components/template-page-slot-variants/template-page-slot-variant-dialog.tsx`

In **add mode**, available definitions are shown as selectable cards. Each card shows the live preview above a small name/key footer. Selecting a card sets `form.ui_block_definition_id`.

```tsx
<button
  onClick={() => setForm((prev) => ({ ...prev, ui_block_definition_id: String(d.id) }))}
  className={`relative flex flex-col rounded-xl border overflow-hidden … ${isSelected ? "border-primary ring-2 ring-primary/30" : "…"}`}
>
  {isSelected && <CheckIcon … />}
  <UiBlockPreview uiBlockKey={d.ui_block_key} />
  <div className="flex flex-col gap-0.5 border-t p-2">
    <span className="font-medium text-xs">{d.name}</span>
    <span className="font-mono text-[10px] text-muted-foreground">{d.ui_block_key}</span>
  </div>
</button>
```

The list is filtered to definitions whose `ui_block_category_id` matches the slot's category, and excludes IDs already used by other variants on the same slot.

---

### 3. Slot Detail Page — Variant Cards

**File:** `src/app/(protected)/(portal)/templates/[id]/[pageId]/[slotId]/page.tsx`

Each saved variant is shown as a full-width preview card with overlay badges and action buttons.

```tsx
<div className="group relative rounded-xl border bg-card ring-1 ring-foreground/10 overflow-hidden">
  <UiBlockPreview uiBlockKey={definition?.ui_block_key ?? ""} />

  {/* Top-left: Default badge + block name */}
  <div className="absolute left-2 top-2 flex items-center gap-1.5">
    {variant.is_default && <span …>Default</span>}
    <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
      {definition?.name}
    </span>
  </div>

  {/* Top-right: Edit / Delete — visible on hover */}
  <div className="absolute right-2 top-2 … opacity-0 group-hover:opacity-100">
    <Button variant="secondary" onClick={() => handleEditVariant(variant)}><PencilIcon /></Button>
    <Button variant="destructive" onClick={() => setConfirmingVariantId(variant.id)}><Trash2Icon /></Button>
  </div>
</div>
```

---

## Updating Preview Appearance

Because all preview rendering goes through `UiBlockPreview`, a single edit there changes how previews look everywhere:

| Change | Edit |
|---|---|
| Different aspect ratio | Change `aspect-video` to e.g. `aspect-[4/3]` |
| Different zoom level | Adjust `scale-[0.5]` and `w-[200%]` proportionally (scale × width% = 100%) |
| Add a loading skeleton | Wrap `UIBlockRenderer` with a `Suspense` boundary |
| Add a dark-mode preview background | Change `bg-white` to `bg-background` |

---

## Adding a New UI Block

1. Create the component in `packages/ui-blocks/src/` (e.g. `src/cta/cta1/index.tsx`)
2. Register it in `packages/ui-blocks/src/registry/index.tsx` with a unique `key`, `defaults`, and `component`
3. Export it from `packages/ui-blocks/src/index.ts`

The new block will automatically appear in `UiBlockPreview` anywhere it is used — no changes needed in the admin app.
