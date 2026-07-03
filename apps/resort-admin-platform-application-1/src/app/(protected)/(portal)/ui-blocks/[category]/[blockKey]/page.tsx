"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Smartphone, Tablet, Monitor } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import { UI_BLOCKS_INDEX } from "ui-blocks";

type DeviceMode = "mobile" | "tablet" | "desktop";

const DEVICES: { mode: DeviceMode; icon: React.ElementType; label: string; width: string }[] = [
  { mode: "mobile",  icon: Smartphone, label: "Mobile",  width: "390px" },
  { mode: "tablet",  icon: Tablet,     label: "Tablet",  width: "768px" },
  { mode: "desktop", icon: Monitor,    label: "Desktop", width: "100%"  },
];

export default function UiBlockPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const blockKey = decodeURIComponent(params.blockKey as string);
  const [device, setDevice] = useState<DeviceMode>("desktop");

  const block = useMemo(
    () => UI_BLOCKS_INDEX.find((b) => b.key === blockKey),
    [blockKey],
  );

  if (!block) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Block not found.
      </div>
    );
  }

  const Component = block.component;
  const { width } = DEVICES.find((d) => d.mode === device)!;

  return (
    <div className="flex flex-col h-full gap-6">

      <header className="flex flex-col gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="self-start gap-1.5 text-muted-foreground hover:text-foreground -ml-2 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{block.name}</h1>
        <p className="text-sm text-muted-foreground">{block.description}</p>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden border rounded-none">
        <header className="flex items-center justify-end gap-1 border-b px-4 py-2 shrink-0 bg-muted/40">
          {DEVICES.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              variant={device === mode ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setDevice(mode)}
              title={label}
              className="h-8 w-8 rounded-none"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <div
            className="h-full mx-auto transition-[width] duration-300"
            style={{ width, maxWidth: "100%" }}
          >
            <Component {...block.defaults} />
          </div>
        </main>
      </div>

    </div>
  );
}
