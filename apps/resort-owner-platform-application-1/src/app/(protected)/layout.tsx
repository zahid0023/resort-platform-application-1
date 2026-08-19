"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken } from "@/services/api"
import { LocalesProvider } from "@/providers/locales-provider"
import { DaysOfWeekProvider } from "@/providers/days-of-week-provider"

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
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
    <LocalesProvider>
      <DaysOfWeekProvider>{children}</DaysOfWeekProvider>
    </LocalesProvider>
  )
}
