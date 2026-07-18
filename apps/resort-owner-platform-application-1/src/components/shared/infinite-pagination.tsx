"use client"

import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@resort/shadcn-ui"

export interface InfinitePaginationProps {
  /** Whether more pages exist */
  hasNext: boolean
  /** Whether a fetch is in progress */
  loading: boolean
  /** Called when the user requests more items */
  onLoadMore: () => void
  /** Number of items currently rendered (for the counter) */
  totalLoaded?: number
  /** Total items available on the server */
  totalElements?: number
  /** Label for the load-more button. Defaults to "Load more" */
  loadMoreLabel?: string
  /** Message shown when every item has been loaded. Pass null to hide it. */
  allLoadedLabel?: string | null
}

/**
 * LoadMore — explicit button variant.
 *
 * Usage:
 * ```tsx
 * <LoadMore
 *   hasNext={hasNext}
 *   loading={loading}
 *   onLoadMore={handleLoadMore}
 *   totalLoaded={items.length}
 *   totalElements={totalElements}
 * />
 * ```
 */
export function LoadMore({
  hasNext,
  loading,
  onLoadMore,
  totalLoaded,
  totalElements,
  loadMoreLabel = "Load more",
  allLoadedLabel = "All items loaded",
}: InfinitePaginationProps) {
  const showCounter = totalLoaded != null && totalElements != null && totalElements > 0

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {showCounter && (
        <p className="text-xs text-muted-foreground">
          {totalLoaded} / {totalElements}
        </p>
      )}

      {hasNext && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLoadMore}
          disabled={loading}
          className="min-w-32 gap-2"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {loadMoreLabel}
        </Button>
      )}

      {!hasNext && loading && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}

      {!hasNext && !loading && allLoadedLabel && (totalLoaded ?? 0) > 0 && (
        <p className="text-xs text-muted-foreground">{allLoadedLabel}</p>
      )}
    </div>
  )
}

/**
 * InfiniteScroll — automatically triggers `onLoadMore` when the sentinel
 * element scrolls into view (IntersectionObserver, 200 px root margin).
 *
 * Usage:
 * ```tsx
 * <InfiniteScroll
 *   hasNext={hasNext}
 *   loading={loading}
 *   onLoadMore={handleLoadMore}
 *   totalLoaded={items.length}
 *   totalElements={totalElements}
 * />
 * ```
 */
export function InfiniteScroll({
  hasNext,
  loading,
  onLoadMore,
  totalLoaded,
  totalElements,
  allLoadedLabel = "All items loaded",
}: InfinitePaginationProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  useEffect(() => { onLoadMoreRef.current = onLoadMore }, [onLoadMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNext || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreRef.current()
      },
      { rootMargin: "200px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNext, loading])

  const showCounter = totalLoaded != null && totalElements != null && totalElements > 0

  if (!hasNext && !loading) {
    if (!allLoadedLabel || (totalLoaded ?? 0) === 0) return null
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        {showCounter && (
          <p className="text-xs text-muted-foreground">{totalLoaded} / {totalElements}</p>
        )}
        <p className="text-xs text-muted-foreground">{allLoadedLabel}</p>
      </div>
    )
  }

  return (
    <div ref={sentinelRef} className="flex justify-center py-4">
      {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
    </div>
  )
}
