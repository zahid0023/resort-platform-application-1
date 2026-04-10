"use client";

import { UIBlockRenderer } from "../ui-block-renderer";

export interface SlotVariant {
  id: number;
  ui_block_key: string;
  display_order: number;
  is_default: boolean;
  props?: Record<string, unknown>;
}

export interface TemplatePageBlockSlotData {
  id: number;
  slot_name: string;
  slot_order: number;
  is_required: boolean;
  variants: SlotVariant[];
}

interface TemplatePageBlockSlotRendererProps {
  slot: TemplatePageBlockSlotData;
  className?: string;
}

export function TemplatePageBlockSlotRenderer({ slot, className }: TemplatePageBlockSlotRendererProps) {
  if (!slot.variants || slot.variants.length === 0) return null;

  const activeVariant =
    slot.variants.find((v) => v.is_default) ??
    [...slot.variants].sort((a, b) => a.display_order - b.display_order)[0];

  return (
    <div className={className}>
      <UIBlockRenderer
        uiBlockKey={activeVariant.ui_block_key}
        props={activeVariant.props}
      />
    </div>
  );
}
