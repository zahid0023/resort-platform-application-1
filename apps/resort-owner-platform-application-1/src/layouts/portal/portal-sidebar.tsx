"use client";

import {
  BlocksIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  LayersIcon,
  LayoutDashboard,
  LayoutTemplateIcon,
  LogOut,
  SettingsIcon,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/sidebar";
import { SidebarMenuButtonActive } from "@/layouts/portal/sidebar-menu-button-active";
import { logout } from "@/services/auth";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Resorts",
    url: "/resorts",
    icon: FileTextIcon,
  },
];

const resortNavItems = [
  { title: "Facilities", url: "/facilities", icon: CreditCardIcon },
  { title: "Highlights", url: "/highlights", icon: SettingsIcon },
  { title: "Map", url: "/map", icon: SettingsIcon },
  { title: "Rooms", url: "/rooms", icon: SettingsIcon },
  { title: "Media", url: "/media", icon: SettingsIcon },
];

const bookingNavItems = [
  { title: "Countries", url: "/countries", icon: GlobeIcon },
  { title: "Cities", url: "/cities", icon: GlobeIcon },
  { title: "Facility Groups", url: "/facility-groups", icon: FolderIcon },
  { title: "Facilities", url: "/facilities", icon: FolderIcon },
];

const userNavItems = [
  { title: "Countries", url: "/countries", icon: GlobeIcon },
  { title: "Cities", url: "/cities", icon: GlobeIcon },
  { title: "Facility Groups", url: "/facility-groups", icon: FolderIcon },
  { title: "Facilities", url: "/facilities", icon: FolderIcon },
];

export function PortalSidebar() {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-b-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
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
            <SidebarGroupLabel>Main</SidebarGroupLabel>
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
            <SidebarGroupLabel>Resort</SidebarGroupLabel>
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
            <SidebarGroupLabel>Booking</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {bookingNavItems.map((item) => (
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
            <SidebarGroupLabel>Users</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {userNavItems.map((item) => (
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

      </SidebarContent>

      <SidebarFooter className="border-t border-t-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive">
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
