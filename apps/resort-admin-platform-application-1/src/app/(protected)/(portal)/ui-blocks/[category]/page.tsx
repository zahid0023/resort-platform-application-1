"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { UI_BLOCKS_INDEX, BlocksNav, BlockItem } from "ui-blocks";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 5;

export default function UiBlockCategoryPage() {
  const params = useParams();
  const category = decodeURIComponent(params.category as string);
  const [page, setPage] = useState(0);

  const blocks = useMemo(
    () => UI_BLOCKS_INDEX.filter((b) => b.category === category),
    [category],
  );

  useEffect(() => {
    setPage(0);
  }, [category]);

  const totalPages = Math.ceil(blocks.length / PAGE_SIZE);
  const pagedBlocks = useMemo(
    () => blocks.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [blocks, page],
  );

  function handlePageChange(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader
        eyebrow="UI Block Library"
        title={category.charAt(0).toUpperCase() + category.slice(1)}
        subtitle={`${blocks.length} block${blocks.length !== 1 ? "s" : ""} in this category.`}
      />

      <BlocksNav />

      {blocks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          No blocks found for this category.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-12">
            {pagedBlocks.map((block) => (
              <BlockItem key={block.key} block={block} />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={blocks.length}
            hasNext={page < totalPages - 1}
            hasPrevious={page > 0}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
