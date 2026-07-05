"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken } from "@/services/api"

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

  return <>{children}</>
}
