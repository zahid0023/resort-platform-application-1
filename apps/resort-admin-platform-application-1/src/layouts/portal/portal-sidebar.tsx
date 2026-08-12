"use client";

import {
  BedDoubleIcon,
  BlocksIcon,
  CalendarDaysIcon,
  CloudIcon,
  CoinsIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  LanguagesIcon,
  LayersIcon,
  LayoutDashboard,
  LayoutTemplateIcon,
  LogOut,
  MapPinIcon,
  PhoneCallIcon,
  RadioIcon,
  SettingsIcon,
  TargetIcon,
  UserCogIcon,
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

const priceNavItems = [
  { title: "Price Scopes", url: "/price-scopes", icon: TargetIcon },
  { title: "Price Types", url: "/price-types", icon: CreditCardIcon },
  { title: "Price Units", url: "/price-units", icon: CreditCardIcon },
];

const resortNavItems = [
  { title: "Resort Permission Types", url: "/resort-permission-types", icon: SettingsIcon },
  { title: "Resort Role Types", url: "/resort-role-types", icon: UserCogIcon },
];

const roomNavItems = [
  { title: "Room Categories", url: "/room-categories", icon: SettingsIcon },
  { title: "Bed Types", url: "/bed-types", icon: BedDoubleIcon },
];

const contactNavItems = [
  { title: "Contact Types", url: "/contact-types", icon: PhoneCallIcon },
  { title: "Communication Channels", url: "/communication-channels", icon: RadioIcon },
];

const addressNavItems = [
  { title: "Country", url: "/countries", icon: GlobeIcon },
  { title: "City", url: "/cities", icon: MapPinIcon },
];

const currencyNavItems = [
  { title: "Currency", url: "/currencies", icon: CoinsIcon },
];

const hostingNavItems = [
  { title: "Image Hosting", url: "/image-hosting-providers", icon: CloudIcon },
];

const facilityNavItems = [
  { title: "Facility Scopes", url: "/facility-scopes", icon: SettingsIcon },
  { title: "Facility Groups", url: "/facility-groups", icon: FolderIcon },
  { title: "Facilities", url: "/facilities", icon: BlocksIcon },
];

const commonNavItems = [
  { title: "Locales", url: "/locales", icon: LanguagesIcon },
  { title: "Days of Week", url: "/days-of-week", icon: CalendarDaysIcon },
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
            <SidebarGroupLabel>Price</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {priceNavItems.map((item) => (
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
            <SidebarGroupLabel>Room</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {roomNavItems.map((item) => (
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
            <SidebarGroupLabel>Contact</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {contactNavItems.map((item) => (
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
            <SidebarGroupLabel>Address</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {addressNavItems.map((item) => (
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
            <SidebarGroupLabel>Currency</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {currencyNavItems.map((item) => (
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
            <SidebarGroupLabel>Hosting</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {hostingNavItems.map((item) => (
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
            <SidebarGroupLabel>Facility</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {facilityNavItems.map((item) => (
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
