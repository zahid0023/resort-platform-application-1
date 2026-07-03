"use client";

import { useMemo, useState } from "react";
import { UI_BLOCKS_INDEX, UI_BLOCK_CATEGORIES, BlocksNav, BlockItem } from "ui-blocks";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 5;

export default function UiBlocksPage() {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(UI_BLOCKS_INDEX.length / PAGE_SIZE);
  const pagedBlocks = useMemo(
    () => UI_BLOCKS_INDEX.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [page],
  );

  function handlePageChange(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="UI Block Library"
        subtitle={`${UI_BLOCKS_INDEX.length} blocks across ${UI_BLOCK_CATEGORIES.length} categories.`}
      />

      <BlocksNav />

      <div className="flex flex-col gap-12">
        {pagedBlocks.map((block) => (
          <BlockItem key={block.key} block={block} />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalElements={UI_BLOCKS_INDEX.length}
        hasNext={page < totalPages - 1}
        hasPrevious={page > 0}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
