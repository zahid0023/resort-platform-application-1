"use client";

import { UI_BLOCKS_INDEX } from "../../registry";

interface UIBlockRendererProps {
  uiBlockKey: string;
  props?: Record<string, unknown>;
  className?: string;
}

export function UIBlockRenderer({ uiBlockKey, props, className }: UIBlockRendererProps) {
  const uiBlock = UI_BLOCKS_INDEX.find((b) => b.key === uiBlockKey);
  if (!uiBlock) return null;
  const UIBlock = uiBlock.component;
  return (
    <div className={className}>
      <UIBlock {...uiBlock.defaults} {...props} />
    </div>
  );
}
