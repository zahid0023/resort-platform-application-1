"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { UI_BLOCKS_INDEX } from "ui-blocks";

export default function BlockViewPage() {
  const params = useParams();
  const blockKey = decodeURIComponent(params.blockKey as string);

  const block = useMemo(
    () => UI_BLOCKS_INDEX.find((b) => b.key === blockKey),
    [blockKey],
  );

  if (!block) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Block not found.
      </div>
    );
  }

  const Component = block.component;

  return (
    <div className="min-h-screen bg-background">
      <Component {...block.defaults} />
    </div>
  );
}
