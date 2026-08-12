"use client"

import { SidebarProvider } from "@resort/shadcn-ui"
import { ResortPortalSidebar } from "@/layouts/resort-portal/resort-portal-sidebar"
import { ResortPortalHeader } from "@/layouts/resort-portal/resort-portal-header"

export default function ResortPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <ResortPortalSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <ResortPortalHeader />
          <main className="relative flex-1 overflow-auto bg-muted/30 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
