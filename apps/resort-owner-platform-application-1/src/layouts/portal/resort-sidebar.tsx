"use client"

import {
  BuildingIcon,
  GalleryHorizontalEndIcon,
  LayoutDashboardIcon,
  LogOut,
  MapIcon,
  MapPinIcon,
  SparklesIcon,
  BedDoubleIcon,
  ZapIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { SidebarMenuButtonActive } from "@/layouts/portal/sidebar-menu-button-active"
import { logout } from "@/services/auth"

interface ResortSidebarProps {
  resortId: string
}

export function ResortSidebar({ resortId }: ResortSidebarProps) {
  const router = useRouter()

  const base = `/resorts/${resortId}`

  const mainNavItems = [
    { title: "Dashboard", url: `${base}/dashboard`, icon: LayoutDashboardIcon },
  ]

  const resortNavItems = [
    { title: "Resort Profile", url: `${base}/resort-profile`, icon: BuildingIcon },
    { title: "Facilities", url: `${base}/facilities`, icon: SparklesIcon },
    { title: "Map", url: `${base}/map`, icon: MapIcon },
    { title: "Rooms", url: `${base}/rooms`, icon: BedDoubleIcon },
    { title: "Media", url: `${base}/media`, icon: GalleryHorizontalEndIcon },
  ]

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-b-sidebar-border">
        <Link href="/resorts" className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center">
            <ZapIcon className="size-5 text-primary" />
          </div>
          <span className="truncate font-medium">Resort</span>
          <SidebarTrigger className="ml-auto sm:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButtonActive
                    icon={<item.icon />}
                    title={item.title}
                    url={item.url}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {resortNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButtonActive
                    icon={<item.icon />}
                    title={item.title}
                    url={item.url}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarGroupLabel>Navigate</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButtonActive
                  icon={<MapPinIcon />}
                  title="All Resorts"
                  url="/resorts"
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-t-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:text-destructive"
            >
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
