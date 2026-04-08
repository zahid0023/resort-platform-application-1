# @shadcn-blocks/ui

A dynamic shadcn/ui block library. Import beautiful, production-ready UI blocks and render them by key in any React application.

## Installation

```bash
npm install @shadcn-blocks/ui
# or
pnpm add @shadcn-blocks/ui
```

You also need Tailwind CSS configured in your project with the CSS variables from shadcn/ui.

## Usage

### Dynamic Rendering by Key

```tsx
import { BlockRenderer } from "@shadcn-blocks/ui"

export default function Page() {
  return (
    <main>
      <BlockRenderer blockKey="navbar" />
      <BlockRenderer blockKey="hero-section" props={{ headline: "Welcome to My App" }} />
      <BlockRenderer blockKey="feature-grid" />
      <BlockRenderer blockKey="pricing-table" />
      <BlockRenderer blockKey="testimonials" />
      <BlockRenderer blockKey="cta-section" props={{ variant: "gradient" }} />
      <BlockRenderer blockKey="footer" />
    </main>
  )
}
```

### Direct Imports

```tsx
import { HeroSection, FeatureGrid, PricingTable } from "@shadcn-blocks/ui"

export default function Page() {
  return (
    <>
      <HeroSection
        headline="Ship faster"
        badge="v2.0 Released"
        primaryCta={{ label: "Start now", onClick: () => router.push("/signup") }}
      />
      <FeatureGrid columns={3} />
      <PricingTable />
    </>
  )
}
```

### Registry Utilities

```tsx
import { blockKeys, getAllBlocks, getBlocksByCategory, blockRegistry } from "@shadcn-blocks/ui"

// All available block keys
console.log(blockKeys)
// ["hero-section", "feature-grid", "pricing-table", ...]

// Get all block metadata
const allBlocks = getAllBlocks()

// Filter by category
const marketingBlocks = getBlocksByCategory("marketing")

// Render block from registry programmatically
const meta = blockRegistry["hero-section"]
const Component = meta.component
return <Component headline="Dynamic!" />
```

## Available Blocks

| Key | Display Name | Category |
|-----|-------------|----------|
| `hero-section` | Hero Section | marketing |
| `feature-grid` | Feature Grid | marketing |
| `pricing-table` | Pricing Table | marketing |
| `testimonials` | Testimonials | marketing |
| `cta-section` | CTA Section | marketing |
| `navbar` | Navbar | navigation |
| `footer` | Footer | navigation |
| `stats-section` | Stats Section | content |
| `faq-accordion` | FAQ Accordion | content |
| `contact-form` | Contact Form | form |

## Customization

Every block accepts a `className` prop and typed props for content customization. All default content can be overridden via props.

## License

MIT
