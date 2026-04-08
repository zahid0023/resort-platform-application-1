# Dev Scripts

All scripts are run from the **repo root** using pnpm.

---

## Root Scripts

Defined in `/package.json`:

| Script | Command | Description |
|--------|---------|-------------|
| `dev:admin` | `pnpm --filter resort-admin-platform-application-1 dev` | Start the Admin app in dev mode |
| `dev:owner` | `pnpm --filter resort-owner-platform-application-1 dev` | Start the Owner app in dev mode |
| `dev:user` | `pnpm --filter resort-user-platform-application-1 dev` | Start the User app in dev mode |
| `dev:ui` | `pnpm --filter ui-blocks dev` | Watch & rebuild ui-blocks on change |
| `build:all` | Build ui-blocks first, then all apps | Full production build |

### Usage

```bash
# Run the admin app
pnpm dev:admin

# Run the user app
pnpm dev:user

# Watch ui-blocks for changes (run alongside an app in another terminal)
pnpm dev:ui

# Build everything for production
pnpm build:all
```

---

## Developing ui-blocks Alongside an App

Open two terminals:

**Terminal 1 — watch ui-blocks:**
```bash
pnpm dev:ui
```

**Terminal 2 — run the app:**
```bash
pnpm dev:admin
```

Changes to any block in `packages/ui-blocks/src/` will be picked up automatically.

---

## Installing Dependencies

Always install from the **repo root** to keep the lockfile consistent:

```bash
pnpm install
```

To add a dependency to a specific app:

```bash
pnpm --filter resort-admin-platform-application-1 add <package>
```

To add a dependency to ui-blocks:

```bash
pnpm --filter ui-blocks add <package>
```
