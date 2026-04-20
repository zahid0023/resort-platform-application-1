---
name: new-page
description: Scaffold a new Next.js App Router page in the resort admin portal. Use when adding a new route under (protected)/(portal)/ that needs its own layout, header, and content area.
argument-hint: "<route-path> [title] [description]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write
---

Scaffold a new Next.js App Router page at route **$ARGUMENTS** inside this project.

## Context to read first

Read one of these existing pages to match the exact pattern:
- `apps/resort-admin-platform-application-1/src/app/(protected)/(portal)/facilities/page.tsx`
- `apps/resort-admin-platform-application-1/src/app/(protected)/(portal)/facility-groups/page.tsx`

Also check the sidebar nav to understand where to add the new route link:
- Glob for `sidebar` in `apps/resort-admin-platform-application-1/src/` to find the nav file.

## Rules

1. File goes at: `apps/resort-admin-platform-application-1/src/app/(protected)/(portal)/<route>/page.tsx`
2. `"use client"` directive always.
3. Page header pattern:
   ```tsx
   <div className="flex items-center justify-between">
     <div>
       <h1 className="text-xl font-semibold">{Title}</h1>
       <p className="text-sm text-muted-foreground">{Description}</p>
     </div>
     {/* optional action button */}
   </div>
   ```
4. Loading state: `<Spinner className="size-6" />` centered with `py-20`.
5. Empty state: `<div className="flex justify-center py-20 text-sm text-muted-foreground">No records found.</div>`
6. All data fetching via services in `@/services/`.

## Before writing

Ask the user:
1. What is the page title and subtitle?
2. Does it need a "New …" button (i.e. is it a list page)?
3. Should a link be added to the sidebar nav?

Then write the page file and (if confirmed) update the sidebar nav.
