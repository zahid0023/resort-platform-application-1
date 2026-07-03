"use client";

import { useState } from "react";
import { type ComponentType } from "react";
import Link from "next/link";
import { Monitor, Tablet, Smartphone, Maximize2 } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import type { UiBlockMeta } from "../registry";

type DeviceMode = "desktop" | "tablet" | "mobile";

const DEVICES: {
  mode: DeviceMode;
  icon: ComponentType<{ className?: string }>;
  label: string;
  width: string;
}[] = [
  { mode: "desktop", icon: Monitor, label: "Desktop", width: "100%" },
  { mode: "tablet", icon: Tablet, label: "Tablet", width: "768px" },
  { mode: "mobile", icon: Smartphone, label: "Mobile", width: "390px" },
];

interface BlockItemProps {
  block: UiBlockMeta;
  previewBasePath?: string;
}

export function BlockItem({ block, previewBasePath = "/ui-blocks-view" }: BlockItemProps) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const { width } = DEVICES.find((d) => d.mode === device) ?? DEVICES[0];

  const Component = block.component;

  return (
    <div className="flex flex-col gap-3" id={block.key}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="flex-1 min-w-0 text-sm text-muted-foreground truncate">
          <span className="font-medium text-foreground">{block.name}</span>
          <span className="mx-1.5">·</span>
          {block.description}
        </p>

        {/* Device toggles */}
        <div className="flex items-center gap-px border rounded-md p-[3px] bg-muted/30 shrink-0">
          {DEVICES.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              variant={device === mode ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 rounded-sm shadow-none"
              onClick={() => setDevice(mode)}
              title={label}
            >
              <Icon className="h-[14px] w-[14px]" />
            </Button>
          ))}
        </div>

        {/* Open fullscreen */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 shadow-none shrink-0"
          asChild
        >
          <Link href={`${previewBasePath}/${block.key}`} target="_blank" rel="noopener noreferrer">
            <Maximize2 className="h-3.5 w-3.5" />
            Open
          </Link>
        </Button>
      </div>

      {/* Preview area with dotted background */}
      <div className="relative overflow-hidden rounded-xl border">
        {/* Dotted grid background */}
        <div className="absolute inset-0 [background-image:radial-gradient(#d4d4d4_1px,transparent_1px)] dark:[background-image:radial-gradient(#404040_1px,transparent_1px)] [background-size:20px_20px]" />

        {/* Device-width-constrained component */}
        <div
          className="relative z-10 mx-auto h-[930px] overflow-hidden bg-background transition-[width] duration-300"
          style={{ width, maxWidth: "100%" }}
        >
          <Component {...block.defaults} />
        </div>
      </div>
    </div>
  );
}
