import { type ComponentType } from "react";
import Hero1 from "../hero/hero1";
import hero1Schema from "../hero/hero1/schema.json";
import hero1Defaults from "../hero/hero1/default.json";
import Hero4 from "../hero/hero4";
import hero4Schema from "../hero/hero4/schema.json";
import hero4Defaults from "../hero/hero4/default.json";
import Gallery1 from "../gallery/gallery1";
import gallery1Schema from "../gallery/gallery1/schema.json";
import gallery1Defaults from "../gallery/gallery1/default.json";
import Gallery4 from "../gallery/gallery4";
import gallery4Schema from "../gallery/gallery4/schema.json";
import gallery4Defaults from "../gallery/gallery4/default.json";
import type { UiBlockCategoryKey, PageTypeKey, AllowedPageKey } from "./enums";

export type { UiBlockCategoryKey, PageTypeKey, AllowedPageKey } from "./enums";
export { UI_BLOCK_CATEGORY_KEYS, PAGE_TYPE_KEYS } from "./enums";

export interface EditableProp {
  name: string;
  type: "string" | "number" | "boolean" | "select" | "color";
  label: string;
  options?: string[];
}

export interface UiBlockSchema {
  key: string;
  name: string;
  description: string;
  category: UiBlockCategoryKey;  // must match ui_block_category.key in DB
  pageType?: PageTypeKey;         // must match page_type.key in DB
  allowedPages?: AllowedPageKey[]; // must be a subset of page_type.key values in DB
  props: EditableProp[];
}

export interface UiBlockMeta {
  key: string;
  name: string;
  description: string;
  category: UiBlockCategoryKey;
  component: ComponentType<Record<string, unknown>>;
  schema: UiBlockSchema;
  defaults: Record<string, unknown>;
}

export const UI_BLOCKS_INDEX: UiBlockMeta[] = [
  {
    key: hero1Schema.key,
    name: hero1Schema.name,
    description: hero1Schema.description,
    category: hero1Schema.category,
    component: Hero1 as ComponentType<Record<string, unknown>>,
    schema: hero1Schema,
    defaults: hero1Defaults,
  },
  {
    key: hero4Schema.key,
    name: hero4Schema.name,
    description: hero4Schema.description,
    category: hero4Schema.category,
    component: Hero4 as ComponentType<Record<string, unknown>>,
    schema: hero4Schema,
    defaults: hero4Defaults,
  },
  {
    key: gallery1Schema.key,
    name: gallery1Schema.name,
    description: gallery1Schema.description,
    category: gallery1Schema.category,
    component: Gallery1 as ComponentType<Record<string, unknown>>,
    schema: gallery1Schema,
    defaults: gallery1Defaults,
  },
  {
    key: gallery4Schema.key,
    name: gallery4Schema.name,
    description: gallery4Schema.description,
    category: gallery4Schema.category,
    component: Gallery4 as ComponentType<Record<string, unknown>>,
    schema: gallery4Schema,
    defaults: gallery4Defaults,
  },
];

export const UI_BLOCK_CATEGORIES = [
  ...new Set(UI_BLOCKS_INDEX.map((uiBlock) => uiBlock.category)),
];
