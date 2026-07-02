"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { Button } from "@resort/shadcn-ui"
import { Spinner } from "@resort/shadcn-ui"
import { getResort } from "@/services/resorts"
import {
  listResortRoomCategories,
  type ResortRoomCategorySummary,
} from "@/services/resort-room-categories"
import CategoryCard from "@/components/room/category-card"
import CreateRoomCategoryDialog from "@/components/room/create-room-category-dialog"

export default function RoomsPage() {
  const params = useParams()
  const resortId = params.resortId as string

  const [resortName, setResortName] = useState<string>("")
  const [resortLoading, setResortLoading] = useState(true)
  const [categories, setCategories] = useState<ResortRoomCategorySummary[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [addCatOpen, setAddCatOpen] = useState(false)

  useEffect(() => {
    getResort(Number(resortId))
      .then((res) => setResortName(res.data.name))
      .catch(() => toast.error("Failed to load resort."))
      .finally(() => setResortLoading(false))
  }, [resortId])

  const refreshCategories = useCallback(() => {
    setCategoriesLoading(true)
    listResortRoomCategories(resortId, { size: 100, sort_by: "sortOrder", sort_dir: "ASC" })
      .then((res) => setCategories(res.data))
      .catch(() => toast.error("Failed to load categories."))
      .finally(() => setCategoriesLoading(false))
  }, [resortId])

  useEffect(() => { refreshCategories() }, [refreshCategories])

  const nextSortOrder =
    categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 1

  if (resortLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
            Inventory · {resortName}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {categoriesLoading
              ? "Loading…"
              : `${categories.length} ${categories.length === 1 ? "category" : "categories"}`}
          </h1>
        </div>
        <Button
          onClick={() => setAddCatOpen(true)}
          className="hover:cursor-pointer"
        >
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      {!categoriesLoading && categories.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No categories yet. Create your first collection to start adding rooms.
          </p>
          <Button
            onClick={() => setAddCatOpen(true)}
            className="hover:cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New category
          </Button>
        </div>
      )}

      <div className="space-y-5">
        {categories.map((cat, i) => (
          <CategoryCard key={cat.id} cat={cat} resortId={resortId} index={i} />
        ))}
      </div>

      <CreateRoomCategoryDialog
        open={addCatOpen}
        onOpenChange={setAddCatOpen}
        nextSortOrder={nextSortOrder}
        onCreated={refreshCategories}
        resortId={resortId}
        existingCategoryIds={categories.map((c) => c.room_category_id)}
      />
    </div>
  )
}
