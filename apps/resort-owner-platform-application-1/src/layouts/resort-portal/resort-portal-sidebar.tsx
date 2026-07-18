"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { LayoutDashboard, BuildingIcon, ImageIcon, Images, Layers, ListTree, LogOut, ZapIcon, PhoneIcon, SettingsIcon, BedDouble } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@resort/shadcn-ui"
import { SidebarMenuButtonActive } from "./sidebar-menu-button-active"
import { logout } from "@/services/auth"

export function ResortPortalSidebar() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const id = String(params.id)

  const navItems = [
    { key: "dashboard", url: `/resorts/${id}/dashboard`, icon: LayoutDashboard },
    { key: "basicInfo", url: `/resorts/${id}/basic-info`, icon: BuildingIcon },
    { key: "contacts", url: `/resorts/${id}/contacts`, icon: PhoneIcon },
    { key: "facilityGroups", url: `/resorts/${id}/facility-groups`, icon: Layers },
    { key: "facilities", url: `/resorts/${id}/facilities`, icon: ListTree },
    { key: "roomCategories", url: `/resorts/${id}/room-categories`, icon: BedDouble },
    { key: "images", url: `/resorts/${id}/images`, icon: Images },
    { key: "imageStorage", url: `/resorts/${id}/image-storage`, icon: ImageIcon },
    { key: "settings", url: `/resorts/${id}/settings`, icon: SettingsIcon },
  ]

  function handleLogout() {
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
          <span className="truncate font-medium">{t("resortPortal.title")}</span>
          <SidebarTrigger className="ml-auto sm:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map(({ key, url, icon: Icon }) => (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButtonActive
                    icon={<Icon />}
                    title={t(`resortPortal.nav.${key}`)}
                    url={url}
                  />
                </SidebarMenuItem>
              ))}
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
              <span>{t("resortPortal.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
