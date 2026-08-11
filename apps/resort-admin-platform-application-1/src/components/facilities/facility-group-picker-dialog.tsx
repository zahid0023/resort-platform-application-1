"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Layers, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge, Dialog, DialogContent, DialogTitle, Input } from "@resort/shadcn-ui";
import { IconRenderer } from "@/components/shared/icon-picker";
import { listFacilityGroups, type FacilityGroupSummary } from "@/services/facility-groups";
import { toIconValue } from "@/components/facility-groups/types";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 20;

export interface FacilityGroupPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Already-picked group ids — excluded from the pickable list so the same group can't be added twice. */
  excludeIds?: number[];
  onSelect: (group: FacilityGroupSummary) => void;
}

export function FacilityGroupPickerDialog({ open, onOpenChange, excludeIds, onSelect }: FacilityGroupPickerDialogProps) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<FacilityGroupSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const lastSearchKey = useRef("");

  useEffect(() => {
    if (open) {
      setSearch("");
      setPage(0);
      lastSearchKey.current = "";
      load(0, "");
    } else {
      setGroups([]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    if (lastSearchKey.current === search) return;
    lastSearchKey.current = search;
    setPage(0);
    const timer = setTimeout(() => load(0, search), 350);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(p: number, q: string) {
    setLoading(true);
    try {
      const res = await listFacilityGroups({
        page: p,
        size: PAGE_SIZE,
        sort_by: "sortOrder",
        code: q.trim() || undefined,
      });
      setGroups(res.data);
      setPage(p);
      setTotalPages(res.total_pages);
      setTotalElements(res.total_elements);
      setHasNext(res.has_next);
      setHasPrevious(res.has_previous);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facilityGroupPicker.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(group: FacilityGroupSummary) {
    onSelect(group);
    onOpenChange(false);
  }

  const excluded = new Set(excludeIds ?? []);
  const selectable = groups.filter((g) => !excluded.has(g.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogTitle className="sr-only">{t("facilityGroupPicker.title")}</DialogTitle>

        {/* Header */}
        <div className="flex flex-col gap-3 px-5 pt-4 pb-4 pr-12 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t("facilityGroupPicker.title")}</p>
              {totalElements > 0 && (
                <p className="text-xs text-muted-foreground">{t("facilityGroupPicker.count", { n: totalElements })}</p>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("facilityGroupPicker.searchPlaceholder")}
              className="pl-8 h-8 text-sm w-full"
              autoFocus
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : selectable.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground border rounded-xl border-dashed">
              {t("facilityGroupPicker.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectable.map((g) => {
                const icon = toIconValue(g);
                const accentColor = icon.meta?.color || undefined;
                const name = g.locale?.name ?? g.code;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleSelect(g)}
                    className="text-left rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 bg-card hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: accentColor
                            ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                            : undefined,
                          boxShadow: accentColor ? `0 4px 14px -4px ${accentColor}80` : undefined,
                        }}
                      >
                        <IconRenderer
                          icon={icon}
                          className="h-4 w-4"
                          style={{ color: accentColor ? "white" : undefined }}
                          fallback={<Layers className="h-4 w-4" />}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight truncate">{name}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4">
                            {g.code}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t px-5 py-3 shrink-0">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              onPageChange={(p) => load(p, search)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
