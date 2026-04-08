"use client";

import { UI_BLOCKS_INDEX, type UiBlockMeta } from "../../registry";

interface UIBlockGalleryProps {
  uiBlocks?: UiBlockMeta[];
  onPreview?: (uiBlock: UiBlockMeta) => void;
}

export function UIBlockGallery({ uiBlocks = UI_BLOCKS_INDEX, onPreview }: UIBlockGalleryProps) {

  return (
    <div className="flex flex-col gap-6">

      {/* UIBlock grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 hover:cursor-pointer">
        {uiBlocks.map((uiBlock) => {
          const UIBlock = uiBlock.component;
          return (
            <div
              key={uiBlock.key}
              onClick={() => onPreview?.(uiBlock)}
              className="h-48 overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10 transition-all hover:ring-2 hover:ring-primary p-2"
            >
              <div className="pointer-events-none w-full origin-top scale-90 p-3">
                <UIBlock {...uiBlock.defaults} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
