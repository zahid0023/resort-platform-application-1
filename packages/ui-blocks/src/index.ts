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

// Shared UI components — reusable across admin and owner apps
export { BlocksNav } from "./components/blocks-nav";
export { BlockItem } from "./components/block-item";
export { LucideIconRenderer } from "./components/lucide-icon-renderer";
export { LucideIconPicker } from "./components/lucide-icon-picker";
