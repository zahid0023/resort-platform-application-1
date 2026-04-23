// UI components
export * from "./components/ui/accordion";
export * from "./components/ui/avatar";
export * from "./components/ui/badge";
export * from "./components/ui/button";
export * from "./components/ui/card";
export * from "./components/ui/input";
export * from "./components/ui/label";
export * from "./components/ui/separator";

// Hero blocks
export { default as Hero1 } from "./hero/hero1";
export { default as Hero4 } from "./hero/hero4";

// Gallery blocks
export { default as Gallery1 } from "./gallery/gallery1";
export { default as Gallery4 } from "./gallery/gallery4";

// Registry
export {
  UI_BLOCKS_INDEX,
  UI_BLOCK_CATEGORIES,
  UI_BLOCK_CATEGORY_KEYS,
  PAGE_TYPE_KEYS,
  type UiBlockMeta,
  type UiBlockSchema,
  type EditableProp,
  type UiBlockCategoryKey,
  type PageTypeKey,
  type AllowedPageKey,
} from "./registry";

// Icon renderers
export { LucideIconRenderer } from "./components/lucide-icon-renderer.tsx";
export type { LucideIconProps as LucideIconRendererProps } from "./components/lucide-icon-renderer.tsx";
export { default as LucideIconPicker } from "./components/lucide-icon-picker";

// Renderers — usable in any Next.js app
export { UIBlockRenderer } from "./components/ui-block-renderer";
export { UIBlockGallery } from "./components/ui-block-gallery";
export { UIBlockPreviewPage } from "./components/ui-block-preview-page";
export { TemplatePageBlockSlotRenderer, type TemplatePageBlockSlotData, type SlotVariant } from "./components/template-page-block-slot-renderer";
export { TemplatePageRenderer, type TemplatePageData } from "./components/template-page-renderer";
export { TemplateRenderer, type TemplateData } from "./components/template-renderer";
