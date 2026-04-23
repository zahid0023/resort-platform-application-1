"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FacilityGroupCard } from "@/components/facility-groups/facility-group-card";
import {
  FacilityGroupDialog,
  type FacilityGroupDialogMode,
  type FacilityGroupFormPayload,
} from "@/components/facility-groups/facility-group-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listFacilityGroups,
  getFacilityGroup,
  createFacilityGroup,
  updateFacilityGroup,
  deleteFacilityGroup,
  type FacilityGroupSummary,
  type FacilityGroupListResponse,
} from "@/services/facility-groups";

export default function FacilityGroupsPage() {
  const [data, setData] = useState<FacilityGroupListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<FacilityGroupDialogMode>("create");
  const [activeItem, setActiveItem] = useState<FacilityGroupSummary | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      setData(await listFacilityGroups({ page, size: 10, sort_by: "id", sort_dir: "ASC" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleCreate = () => {
    setActiveItem(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleView = (item: FacilityGroupSummary) => {
    setActiveItem(item);
    setDialogMode("view");
    setDialogOpen(true);
  };

  const handleEdit = async (item: FacilityGroupSummary) => {
    try {
      const res = await getFacilityGroup(item.id);
      setActiveItem(res.data);
      setDialogMode("edit");
      setDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load.");
    }
  };

  const handleDialogSubmit = async (payload: FacilityGroupFormPayload) => {
    if (dialogMode === "edit" && activeItem) {
      await updateFacilityGroup(activeItem.id, payload);
      toast.success("Facility group updated.");
    } else {
      await createFacilityGroup(payload);
      toast.success("Facility group created.");
    }
    setDialogOpen(false);
    fetchList();
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteFacilityGroup(deleteId);
      toast.success("Facility group deleted.");
      setDeleteId(null);
      fetchList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Facility Groups</h1>
          <p className="text-sm text-muted-foreground">Organize facilities into logical groups.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon />New Facility Group
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
      ) : data?.data.length === 0 ? (
        <div className="flex justify-center py-20 text-sm text-muted-foreground">No facility groups found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.data.map((item, i) => (
            <FacilityGroupCard
              key={item.id}
              item={item}
              index={i}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={(it) => setDeleteId(it.id)}
            />
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.current_page + 1} of {data.total_pages} — {data.total_elements} total</span>
          <div className="flex gap-2">
            <Button size="icon-sm" variant="outline" disabled={!data.has_previous} onClick={() => setPage(p => p - 1)}>
              <ChevronLeftIcon />
            </Button>
            <Button size="icon-sm" variant="outline" disabled={!data.has_next} onClick={() => setPage(p => p + 1)}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      <FacilityGroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialItem={activeItem}
        onSubmit={handleDialogSubmit}
        onSwitchToEdit={() => setDialogMode("edit")}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this facility group?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The group will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
