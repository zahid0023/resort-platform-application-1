"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarMenuButton, useSidebar } from "@resort/shadcn-ui"

interface SidebarMenuButtonActiveProps {
  title: string
  url: string
  icon: React.ReactNode
}

export function SidebarMenuButtonActive({ title, url, icon }: SidebarMenuButtonActiveProps) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarMenuButton
      asChild
      isActive={pathname === url}
      onClick={() => isMobile && setOpenMobile(false)}
      tooltip={title}
    >
      <Link href={url}>
        {icon}
        <span>{title}</span>
      </Link>
    </SidebarMenuButton>
  )
}
