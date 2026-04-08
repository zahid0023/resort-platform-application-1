# Architecture Overview

## Monorepo Structure

```
resort-platform-application-1/
├── package.json               # Root workspace scripts
├── pnpm-workspace.yaml        # Declares apps/* and packages/* as workspaces
├── pnpm-lock.yaml
│
├── apps/
│   ├── resort-admin-platform-application-1/   # Admin Next.js app
│   ├── resort-owner-platform-application-1/   # Owner Next.js app
│   └── resort-user-platform-application-1/    # User Next.js app
│
└── packages/
    ├── ui-blocks/             # Shared UI component library
    └── config/                # Shared config (@resort/config)
```

## Workspace Manager

This project uses **pnpm workspaces**. The `pnpm-workspace.yaml` at the root registers all packages:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

This means any package in `apps/` or `packages/` can reference each other using the `workspace:*` protocol.

## Apps

| App | Package Name | Description |
|-----|-------------|-------------|
| `resort-admin-platform-application-1` | `resort-admin-platform-application-1` | Admin dashboard |
| `resort-owner-platform-application-1` | `resort-owner-platform-application-1` | Resort owner portal |
| `resort-user-platform-application-1` | `resort-user-platform-application-1` | End-user facing app |

All apps use:
- **Next.js 16**
- **React 19**
- **Tailwind CSS v4**
- **TypeScript 5**

## Shared Packages

| Package | Name in package.json | Description |
|---------|---------------------|-------------|
| `packages/ui-blocks` | `ui-blocks` | Shared UI blocks (hero sections, etc.) |
| `packages/config` | `@resort/config` | Shared configuration |
