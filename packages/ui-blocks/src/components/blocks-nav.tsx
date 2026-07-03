"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@resort/shadcn-ui";
import { UI_BLOCK_CATEGORIES } from "../registry";

interface BlocksNavProps {
  basePath?: string;
}

export function BlocksNav({ basePath = "/ui-blocks" }: BlocksNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "All", href: basePath },
    ...UI_BLOCK_CATEGORIES.map((cat) => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      href: `${basePath}/${cat}`,
    })),
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b pb-px">
      {navItems.map(({ label, href }) => {
        const isActive =
          href === basePath
            ? pathname === basePath
            : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex h-9 shrink-0 items-center px-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
