"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PortalHeader } from "@/layouts/portal/portal-header"
import { ResortSidebar } from "@/layouts/portal/resort-sidebar"
import { getToken } from "@/services/api"

export default function ResortPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const params = useParams()
  const resortId = params.resortId as string
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace("/login")
      return
    }
    document.cookie = `access_token=${token}; path=/; SameSite=Lax`
    setReady(true)
  }, [router])

  if (!ready) return null

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <ResortSidebar resortId={resortId} />
          <div className="flex flex-1 flex-col">
            <PortalHeader />
            <main className="flex-1 overflow-auto bg-muted/30 p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
