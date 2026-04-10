"use client";

import { TemplatePageRenderer, type TemplatePageData } from "../template-page-renderer";

export interface TemplateData {
  id: number;
  key: string;
  name: string;
  pages: TemplatePageData[];
}

interface TemplateRendererProps {
  template: TemplateData;
  /** If provided, only the page matching this slug is rendered. */
  currentSlug?: string;
  className?: string;
}

export function TemplateRenderer({ template, currentSlug, className }: TemplateRendererProps) {
  const sortedPages = [...(template.pages ?? [])].sort((a, b) => a.page_order - b.page_order);

  const pagesToRender = currentSlug
    ? sortedPages.filter((p) => p.page_slug === currentSlug)
    : sortedPages;

  return (
    <div className={className}>
      {pagesToRender.map((page) => (
        <TemplatePageRenderer key={page.id} page={page} />
      ))}
    </div>
  );
}
