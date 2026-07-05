"use client";

import {
  BlocksIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  LanguagesIcon,
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
} from "@resort/shadcn-ui";
import { SidebarMenuButtonActive } from "@/layouts/portal/sidebar-menu-button-active";
import { logout } from "@/services/auth";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "UI Blocks",
    url: "/ui-blocks",
    icon: BlocksIcon,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: LayoutTemplateIcon,
  },
];

const builderNavItems = [
  {
    title: "Page Types",
    url: "/page-types",
    icon: FileTextIcon,
  },
  {
    title: "UI Block Sections",
    url: "/ui-block-sections",
    icon: LayersIcon,
  },
];

const resortNavItems = [
  { title: "Room Categories", url: "/room-categories", icon: SettingsIcon },
  { title: "Price Types", url: "/price-types", icon: CreditCardIcon },
  { title: "Price Units", url: "/price-units", icon: CreditCardIcon },
  { title: "Resort Access Types", url: "/resort-access-types", icon: SettingsIcon },
  { title: "Resort Permission Types", url: "/resort-permission-types", icon: SettingsIcon },
];

const commonNavItems = [
  { title: "Countries", url: "/countries", icon: GlobeIcon },
  { title: "Cities", url: "/cities", icon: GlobeIcon },
  { title: "Facility Groups", url: "/facility-groups", icon: FolderIcon },
  { title: "Facilities", url: "/facilities", icon: BlocksIcon },
  { title: "Locales", url: "/locales", icon: LanguagesIcon },
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
            <SidebarGroupLabel>Layout</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {builderNavItems.map((item) => (
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
            <SidebarGroupLabel>Common</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {commonNavItems.map((item) => (
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
