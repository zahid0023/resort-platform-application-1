# Icon System — Admin App

The admin app uses a **strategy-pattern icon system** located in:

```
apps/resort-admin-platform-application-1/src/components/shared/icon-picker/
```

Each icon type is an isolated **strategy** that owns two responsibilities:

| Responsibility | Method | Used by |
|---|---|---|
| Form UI (picker fields) | `strategy.renderPicker(props)` | `<IconPicker>` |
| Display rendering | `strategy.renderIcon(value, meta, opts)` | `<IconRenderer>` |

Both `<IconPicker>` and `<IconRenderer>` are **strategy-agnostic** — adding a new icon type requires no changes to either component.

---

## File Structure

```
src/components/shared/icon-picker/
  types.ts                          ← IconType, IconValue, IconStrategy interface
  color-picker.tsx                  ← reusable colour swatch + hex input + presets
  registry.tsx                      ← ALL_STRATEGIES[], getStrategy(type)
  icon-picker.tsx                   ← type dropdown → strategy.renderPicker()
  icon-renderer.tsx                 ← strategy.renderIcon() wrapper
  index.ts                          ← re-exports everything
  strategies/
    lucide-strategy.tsx             ← Lucide icon grid + colour + size meta
    svg-strategy.tsx                ← raw SVG textarea + colour override + preview
    image-strategy.tsx              ← hosted image URL + alt + object-fit + preview
    external-strategy.tsx           ← external CDN/Iconify URL + alt + preview
    emoji-strategy.tsx              ← text input + 32-emoji quick-grid
```

---

## Data Model

All icon data is stored in a single `IconValue` object:

```ts
interface IconValue {
  type: IconType | ""          // which strategy to use
  value: string                // the primary icon value (name, URL, SVG markup, emoji)
  meta: Record<string, string> // strategy-specific metadata
}
```

`type` is one of: `"LUCIDE" | "SVG" | "IMAGE" | "EXTERNAL" | "EMOJI"`

An empty / unset icon is represented by `EMPTY_ICON_VALUE`:

```ts
import { EMPTY_ICON_VALUE } from "@/components/shared/icon-picker"
// { type: "", value: "", meta: {} }
```

### Meta fields per strategy

| `type` | `meta` keys | Description |
|---|---|---|
| `LUCIDE` | `color`, `size` | CSS hex colour; size in px (e.g. `"24"`) |
| `SVG` | `color` | Sets `currentColor` on the SVG |
| `IMAGE` | `alt`, `fit` | Alt text; `object-fit` (`"contain"` \| `"cover"` \| `"fill"`) |
| `EXTERNAL` | `alt` | Alt text for the `<img>` tag |
| `EMOJI` | _(none)_ | No meta needed |

### Examples

```ts
// Lucide icon — Waves, sky-blue, 24 px
{ type: "LUCIDE", value: "Waves", meta: { color: "#0ea5e9", size: "24" } }

// Raw SVG with a red colour override
{ type: "SVG", value: '<svg viewBox="0 0 24 24">...</svg>', meta: { color: "#ef4444" } }

// Hosted image, object-fit contain
{ type: "IMAGE", value: "https://example.com/icon.png", meta: { alt: "Resort logo", fit: "contain" } }

// External CDN icon
{ type: "EXTERNAL", value: "https://api.iconify.design/mdi/pool.svg", meta: { alt: "Pool" } }

// Emoji
{ type: "EMOJI", value: "🌊", meta: {} }
```

---

## `<IconPicker>` — Form Component

Use inside dialogs / forms wherever users choose an icon.

```tsx
import { IconPicker, IconValue, EMPTY_ICON_VALUE } from "@/components/shared/icon-picker"

const [icon, setIcon] = useState<IconValue>(EMPTY_ICON_VALUE)

<IconPicker value={icon} onChange={setIcon} />

// Read-only display (e.g. view mode in a dialog)
<IconPicker value={icon} onChange={setIcon} readOnly />
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `IconValue` | — | Current icon value (controlled) |
| `onChange` | `(v: IconValue) => void` | — | Called on any change |
| `readOnly` | `boolean` | `false` | Disables all inputs |

### Behaviour

1. Renders a **type selector** dropdown (all registered strategies in order).
2. When a type is selected, resets `value` and `meta` to the strategy's defaults, then renders the strategy's picker fields inside a bordered card.
3. Switching type clears the previous value and meta automatically.

---

## `<IconRenderer>` — Display Component

Use anywhere you need to **display** an icon — cards, list rows, headers, previews.

```tsx
import { IconRenderer } from "@/components/shared/icon-picker"

// Basic usage
<IconRenderer icon={icon} className="h-6 w-6" />

// With a fallback when icon is empty
<IconRenderer
  icon={icon}
  className="h-6 w-6 text-white"
  fallback={<span className="text-xs text-white/60">?</span>}
/>

// With inline style
<IconRenderer icon={icon} className="h-8 w-8" style={{ opacity: 0.8 }} />
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `IconValue` | — | The icon to render |
| `className` | `string` | — | Applied to the rendered element |
| `style` | `CSSProperties` | — | Applied to the rendered element |
| `fallback` | `ReactNode` | `null` | Shown when `type` or `value` is empty |

### How className / style are applied per strategy

| Strategy | Element | Notes |
|---|---|---|
| `LUCIDE` | `<svg>` via `LucideIconRenderer` | `className` + `style` forwarded to SVG |
| `SVG` | `<span dangerouslySetInnerHTML>` | `currentColor` set via `style.color` |
| `IMAGE` | `<img>` | `className` controls `object-fit` |
| `EXTERNAL` | `<img>` | Same as IMAGE |
| `EMOJI` | `<span role="img">` | `className` / `style` forwarded |

---

## `<EntityCardPreview>` — Live Card Preview

`EntityCardPreview` renders a live card preview inside dialogs. It uses `<IconRenderer>` internally and accepts `IconValue` directly.

```tsx
import { EntityCardPreview } from "@/components/shared/entity-card-preview"

<EntityCardPreview
  name={form.name}
  code={form.code}
  description={form.description}
  sort_order={form.sort_order}
  icon={iconValue}          // ← IconValue
  id={entityId}
  readOnly={false}          // false = "Live Card Preview" label
/>
```

The card avatar background gradient is driven by `icon.meta.color` (applies to LUCIDE and SVG strategies).

---

## `<ColorPicker>` — Reusable Colour Input

A standalone colour picker used by the Lucide and SVG strategies. Also available for any other use.

```tsx
import { ColorPicker } from "@/components/shared/icon-picker"

<ColorPicker
  value={color}                  // hex string e.g. "#0ea5e9" or ""
  onChange={(hex) => setColor(hex)}
  disabled={false}
  label="Accent Color"           // optional, default "Color"
/>
```

Renders a popover containing: a native `<input type="color">`, a hex text input, and 10 preset colour swatches. Pressing "Clear color" resets to `""`.

---

## `IconStrategy` Interface

Every strategy is a plain object implementing this interface:

```ts
interface IconStrategy {
  readonly type: IconType       // "LUCIDE" | "SVG" | "IMAGE" | "EXTERNAL" | "EMOJI"
  readonly label: string        // shown in the type dropdown
  readonly description: string  // shown as subtitle in the type dropdown
  defaultMeta(): Record<string, string>  // called when the type is first selected
  renderPicker(props: PickerProps): ReactNode  // renders value + meta form fields
  renderIcon(value: string, meta: Record<string, string>, opts?: RenderIconOpts): ReactNode
}

interface PickerProps {
  value: string
  meta: Record<string, string>
  onValueChange: (value: string) => void
  onMetaChange: (patch: Partial<Record<string, string>>) => void
  readOnly: boolean
}

interface RenderIconOpts {
  className?: string
  style?: CSSProperties
}
```

`renderPicker` is called from `<IconPicker>` and renders **only** the type-specific fields — not the type selector itself.

`renderIcon` is called from `<IconRenderer>` and must return a React node ready to display, or `null` if `value` is empty.

---

## Registry

All strategies are registered in `registry.tsx`:

```ts
import { lucideStrategy } from "./strategies/lucide-strategy"
// ...

export const ALL_STRATEGIES: IconStrategy[] = [
  lucideStrategy,
  svgStrategy,
  imageStrategy,
  externalStrategy,
  emojiStrategy,
]
```

`ALL_STRATEGIES` drives both the type dropdown order and the renderer lookup.

```ts
import { getStrategy } from "@/components/shared/icon-picker"

const strategy = getStrategy("LUCIDE") // → lucideStrategy | undefined
```

---

## Built-in Strategies

### LUCIDE

Uses `LucideIconPicker` (from `ui-blocks`) to browse and select any of the 1 000+ Lucide icons.

**Picker fields:**
- Icon grid with search (filtered, paginated with infinite scroll)
- Colour picker (`meta.color`)
- Size select (`meta.size`: `""`, `"16"`, `"20"`, `"24"`, `"32"`, `"40"`)

**Renderer:** `<LucideIconRenderer name={value} size={Number(meta.size)} style={{ color: meta.color }} />`

---

### SVG

Accepts raw SVG markup. Use `currentColor` in the SVG source to make the colour override work.

**Picker fields:**
- Textarea (monospace, resizable) for the SVG markup
- Colour picker (`meta.color`) — sets `currentColor` via `style.color`
- Inline preview (24 × 24) beneath the textarea

**Renderer:** `<span dangerouslySetInnerHTML={{ __html: value }} style={{ color: meta.color }} />`

> **Security:** SVG markup is rendered via `dangerouslySetInnerHTML`. In this admin portal all users are authenticated staff, so this is acceptable. For any public-facing surface, sanitize with [DOMPurify](https://github.com/cure53/DOMPurify) before rendering.

---

### IMAGE

A hosted image reachable by URL (`.png`, `.jpg`, `.webp`, `.gif`, `.svg`).

**Picker fields:**
- URL input (`value`)
- Alt text input (`meta.alt`)
- Object-fit select (`meta.fit`: `"contain"` / `"cover"` / `"fill"`)
- Inline 64 × 64 preview

**Renderer:** `<img src={value} alt={meta.alt} className={`object-${meta.fit}`} />`

---

### EXTERNAL

A URL pointing to an icon on a CDN, Iconify API, SVG sprite, or any external host. Behaves identically to IMAGE but has different placeholder text and description to guide users.

**Picker fields:**
- URL input with helper text ("Supports CDN, Iconify, SVG sprites…")
- Alt text input (`meta.alt`)
- Inline 64 × 64 preview

**Renderer:** `<img src={value} alt={meta.alt} className="object-contain" />`

---

### EMOJI

Any emoji character (or multi-codepoint sequence such as 🏳️‍🌈). Stored as a raw string.

**Picker fields:**
- Text input (accepts any character; `maxLength={8}` covers longest sequences)
- 32-emoji quick-pick grid with click-to-select

**Renderer:** `<span role="img" aria-label={value}>{value}</span>`

---

## Adding a New Icon Type

Follow these steps to add a custom strategy (e.g. a `"LOTTIE"` animated icon).

### Step 1 — Extend `IconType`

Open `types.ts` and add your key:

```ts
export type IconType = "LUCIDE" | "SVG" | "IMAGE" | "EXTERNAL" | "EMOJI" | "LOTTIE"
```

### Step 2 — Create the strategy file

Create `strategies/lottie-strategy.tsx`:

```tsx
"use client"

import { Input } from "@resort/shadcn-ui"
import { Label } from "@resort/shadcn-ui"
import type { IconStrategy, PickerProps, RenderIconOpts } from "../types"

function LottiePickerFields({ value, onValueChange, readOnly }: PickerProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Lottie JSON URL *</Label>
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="https://assets.lottiefiles.com/packages/lf20_….json"
          disabled={readOnly}
        />
      </div>
    </div>
  )
}

export const lottieStrategy: IconStrategy = {
  type: "LOTTIE",
  label: "Lottie",
  description: "Animated Lottie JSON icon",

  defaultMeta: () => ({ loop: "true", autoplay: "true" }),

  renderPicker: (props) => <LottiePickerFields {...props} />,

  renderIcon: (value, _meta, opts?: RenderIconOpts) => {
    if (!value) return null
    // Replace with a real Lottie player component in production
    return <img src={value} alt="lottie" className={opts?.className} style={opts?.style} />
  },
}
```

### Step 3 — Register the strategy

Open `registry.tsx` and add it:

```ts
import { lottieStrategy } from "./strategies/lottie-strategy"

export const ALL_STRATEGIES: IconStrategy[] = [
  lucideStrategy,
  svgStrategy,
  imageStrategy,
  externalStrategy,
  emojiStrategy,
  lottieStrategy,   // ← add here
]
```

That is all. `<IconPicker>` now shows "Lottie" in the type dropdown, and `<IconRenderer>` calls `lottieStrategy.renderIcon` automatically.

---

## Imports Reference

Everything is re-exported from `index.ts`:

```ts
import {
  // Components
  IconPicker,
  IconRenderer,
  ColorPicker,

  // Types
  type IconType,
  type IconValue,
  type IconStrategy,
  type PickerProps,
  type RenderIconOpts,

  // Constants
  EMPTY_ICON_VALUE,

  // Registry utilities
  ALL_STRATEGIES,
  getStrategy,

  // Individual strategies (advanced use)
  lucideStrategy,
  svgStrategy,
  imageStrategy,
  externalStrategy,
  emojiStrategy,
} from "@/components/shared/icon-picker"
```

---

## Checklist — Using the Icon System in a New Entity

```
[ ] Add IconValue field to the entity form state
[ ] Import EMPTY_ICON_VALUE and use it as the default
[ ] Place <IconPicker> in the create / edit section of the dialog
[ ] Pass readOnly={true} when in view mode
[ ] Pass the form icon value; on change call onFormChange({ icon: ... })
[ ] Use <IconRenderer> in the entity card component
[ ] Pass icon.meta.color as the card avatar gradient (if applicable)
[ ] Use <EntityCardPreview icon={iconValue} ... /> in the dialog preview section
[ ] Map icon_type / icon_value / icon_meta from the API response to IconValue on load
[ ] Map IconValue back to { icon_type, icon_value, icon_meta } when calling create/update
```

### Mapping API ↔ IconValue

The backend stores `icon_type`, `icon_value`, and `icon_meta` as separate fields.

```ts
// API response → IconValue
function toIconValue(entity: { icon_type: string; icon_value: string; icon_meta?: Record<string, unknown> }): IconValue {
  return {
    type: entity.icon_type as IconType,
    value: entity.icon_value ?? "",
    meta: Object.fromEntries(
      Object.entries(entity.icon_meta ?? {}).map(([k, v]) => [k, String(v)])
    ),
  }
}

// IconValue → API payload
function fromIconValue(icon: IconValue) {
  return {
    icon_type: icon.type as IconType,
    icon_value: icon.value,
    icon_meta: Object.keys(icon.meta).length > 0 ? icon.meta : undefined,
  }
}
```
