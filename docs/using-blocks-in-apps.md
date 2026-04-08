# Using Blocks in Apps

This guide shows how to consume the `ui-blocks` package inside any of the three Next.js apps.

---

## Step 1 — Add the Dependency

In the app's `package.json`, add `ui-blocks` as a dependency using the `workspace:*` protocol:

```json
{
  "dependencies": {
    "ui-blocks": "workspace:*"
  }
}
```

Then run from the **repo root**:

```bash
pnpm install
```

> `workspace:*` tells pnpm to link the local `packages/ui-blocks` directly — no npm publish needed.

---

## Step 2 — Import and Use a Block

```tsx
import { Hero1 } from "ui-blocks";

export default function HomePage() {
  return (
    <main>
      <Hero1 />
    </main>
  );
}
```

---

## Which Apps Already Use ui-blocks?

| App | Has `ui-blocks`? |
|-----|-----------------|
| `resort-admin-platform-application-1` | Yes (`workspace:*`) |
| `resort-owner-platform-application-1` | Check `package.json` |
| `resort-user-platform-application-1` | Not yet — add manually |

---

## All Available Block Imports

```ts
import {
  Hero1,
  Hero4,
  // ...more as they are added
} from "ui-blocks";
```

---

## Tailwind CSS Setup

Because `ui-blocks` uses Tailwind CSS classes, make sure the app's Tailwind config scans the `ui-blocks` source files.

In the app's `tailwind.config.ts` (or equivalent), include:

```ts
content: [
  "./src/**/*.{ts,tsx}",
  "../../packages/ui-blocks/src/**/*.{ts,tsx}", // include shared blocks
],
```
