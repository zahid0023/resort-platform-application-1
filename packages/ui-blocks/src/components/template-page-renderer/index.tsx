"use client";

import { TemplatePageBlockSlotRenderer, type TemplatePageBlockSlotData } from "../template-page-block-slot-renderer";

export interface TemplatePageData {
  id: number;
  page_name: string;
  page_slug: string;
  page_order: number;
  slots: TemplatePageBlockSlotData[];
}

interface TemplatePageRendererProps {
  page: TemplatePageData;
  className?: string;
}

export function TemplatePageRenderer({ page, className }: TemplatePageRendererProps) {
  const sortedSlots = [...(page.slots ?? [])].sort((a, b) => a.slot_order - b.slot_order);

  return (
    <div className={className}>
      {sortedSlots.map((slot) => (
        <TemplatePageBlockSlotRenderer key={slot.id} slot={slot} />
      ))}
    </div>
  );
}
