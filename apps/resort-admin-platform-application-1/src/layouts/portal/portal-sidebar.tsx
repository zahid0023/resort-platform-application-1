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
    title: "Page Types",
    url: "/page-types",
    icon: FileTextIcon,
  },
  {
    title: "UI Block Categories",
    url: "/ui-block-categories",
    icon: LayersIcon,
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

const resortNavItems = [
  { title: "Access Types", url: "/access-types", icon: CreditCardIcon },
  { title: "Room Categories", url: "/room-categories", icon: SettingsIcon },
  { title: "Price Types", url: "/price-types", icon: CreditCardIcon },
];

const commonNavItems = [
  { title: "Countries", url: "/countries", icon: GlobeIcon },
  { title: "Cities", url: "/cities", icon: GlobeIcon },
  { title: "Facilities", url: "/facility-groups", icon: FolderIcon },
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
