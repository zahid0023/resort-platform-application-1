---
name: new-component
description: Create a new reusable React component with TypeScript and Tailwind CSS following the project's component patterns. Use when adding a standalone UI component to src/components/ui/ or a feature folder.
argument-hint: "<ComponentName> [destination=ui|<feature-folder>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write
---

Create a new React component named **$ARGUMENTS** following this project's conventions.

## Rules

1. **Always `"use client"`** at the top unless the user explicitly says it's a server component.
2. **TypeScript props interface** named `<ComponentName>Props` defined above the component.
3. **Named export** (no default export for components).
4. **Tailwind only** — no inline styles, no CSS modules.
5. **Import UI primitives** from `@/components/ui/*` (Button, Input, Spinner, etc.) — never re-implement them.
6. **Lucide icons** from `lucide-react` for all icons.
7. **No hardcoded colors** — use design tokens: `text-muted-foreground`, `bg-card`, `border-input`, `text-primary`, etc.
8. **`cn()` helper** from `@/lib/utils` for conditional classes.

## Before writing

Ask the user:
1. What does this component do / what does it render?
2. What props does it need?
3. Where should the file live? (default: `apps/resort-admin-platform-application-1/src/components/ui/`)

Then read 2–3 nearby existing components to match the exact style before generating.

## Output

Write the single `.tsx` file. No barrel `index.ts` unless the user asks.
