---
name: crud-entity
description: Scaffold a complete CRUD entity for the resort admin app — service, card, dialog, and page — following the exact project patterns. Use when adding a new entity like "rooms", "resorts", "packages", etc. Invoke with the entity name and the app target.
argument-hint: "<entity-name> [app=resort-admin-platform-application-1]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

You are scaffolding a new CRUD entity called **$ARGUMENTS** into this monorepo following the established patterns exactly.

## Step 1 — Gather context

Before generating any code, read these reference files to understand the exact patterns in use:

- `apps/resort-admin-platform-application-1/src/services/facilities.ts` — service pattern
- `apps/resort-admin-platform-application-1/src/components/facilities/facility-card.tsx` — card pattern
- `apps/resort-admin-platform-application-1/src/components/facilities/facility-dialog.tsx` — dialog pattern
- `apps/resort-admin-platform-application-1/src/app/(protected)/(portal)/facilities/page.tsx` — page pattern

Also read `apps/resort-admin-platform-application-1/src/services/api.ts` to confirm the `api` helper interface.

## Step 2 — Ask before generating

Before writing any files, ask the user:
1. What fields does this entity have? (name, type, required/optional)
2. What is the API base path? (e.g. `/rooms`)
3. Does the entity relate to any other entity that should be fetched in the dialog (like facility → facility_group)?
4. Which app should the files go in? (default: `resort-admin-platform-application-1`)

## Step 3 — Generate files

Based on the confirmed answers and the patterns read in Step 1, generate these four files:

### 3a. Service — `apps/<app>/src/services/<entity-plural>.ts`
Follow `facilities.ts` exactly:
- `<Entity>Summary` interface (list fields only)
- `<Entity>` interface (full detail fields)
- `<Entity>ListResponse` interface with pagination fields
- `Create<Entity>Request` and `Update<Entity>Request` interfaces
- `MutationResponse` interface (success, id)
- `ListParams` interface (page, size, sort_by with entity-specific sort fields, sort_dir)
- Functions: `list<Entities>`, `get<Entity>`, `create<Entity>`, `update<Entity>`, `delete<Entity>`

### 3b. Card — `apps/<app>/src/components/<entity-plural>/<entity>-card.tsx`
Follow `facility-card.tsx` exactly:
- `"use client"` directive
- Props: `data: <Entity>Summary`, `onEdit: (data: <Entity>Summary) => void`, `onDelete: (id: number) => Promise<void>`
- Confirming + deleting state for delete flow
- Same visual structure: icon container, name+secondary field, action buttons, metadata badges

### 3c. Dialog — `apps/<app>/src/components/<entity-plural>/<entity>-dialog.tsx`
Follow `facility-dialog.tsx` exactly:
- `"use client"` directive
- Props: `open`, `onOpenChange`, `editing: <Entity> | null`, `onSuccess`
- `empty` const with all string fields defaulting to `""`
- `useEffect` to populate form from `editing`, reset on close
- `handleChange` for unified input handler
- `handleSubmit` with loading state, try/catch, `toast.success`/`toast.error`
- Use `<Field>`, `<FieldLabel>`, `<FieldDescription>`, `<Input>`, `<Dialog>`, `<DialogContent>`, etc. from `@/components/ui/*`
- For any related entity selects, fetch them in a `useEffect` on mount

### 3d. Page — `apps/<app>/src/app/(protected)/(portal)/<entity-plural>/page.tsx`
Follow `facilities/page.tsx` exactly:
- `"use client"` directive
- State: `data`, `loading`, `page`, `dialogOpen`, `editing`
- `fetchList` with `useCallback` + `useEffect`
- `handleEdit` fetches full entity then opens dialog
- `handleDelete` calls delete service, toasts, refetches
- Grid layout: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Spinner centered when loading, "No records found." when empty
- Pagination bar with `has_previous`/`has_next` buttons
- `<EntityDialog>` at the bottom

## Step 4 — Confirm and write

Show the user the list of files you are about to create, confirm, then write them all.
