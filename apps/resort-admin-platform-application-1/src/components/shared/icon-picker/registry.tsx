import { lucideStrategy } from "./strategies/lucide-strategy"
import { svgStrategy } from "./strategies/svg-strategy"
import { imageStrategy } from "./strategies/image-strategy"
import { externalStrategy } from "./strategies/external-strategy"
import { emojiStrategy } from "./strategies/emoji-strategy"
import type { IconStrategy, IconType } from "./types"

/**
 * All registered icon strategies, in display order.
 *
 * To add a new icon type:
 *  1. Implement IconStrategy in a new file under ./strategies/
 *  2. Import it here and add it to this array.
 */
export const ALL_STRATEGIES: IconStrategy[] = [
  lucideStrategy,
  svgStrategy,
  imageStrategy,
  externalStrategy,
  emojiStrategy,
]

const strategyMap = new Map<IconType, IconStrategy>(
  ALL_STRATEGIES.map((s) => [s.type, s]),
)

/** Returns the strategy for the given type, or undefined if not found. */
export function getStrategy(type: IconType | ""): IconStrategy | undefined {
  if (!type) return undefined
  return strategyMap.get(type)
}
