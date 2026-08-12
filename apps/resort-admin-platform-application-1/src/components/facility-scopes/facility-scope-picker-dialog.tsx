"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Layers, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Dialog, DialogContent, DialogTitle, Input } from "@resort/shadcn-ui";
import { facilityScopesService, type FacilityScope } from "@/services/facility-scopes";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 20;

export interface FacilityScopePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Already-picked scope ids — excluded from the pickable list so the same scope can't be added twice. */
  excludeIds?: number[];
  /** Called once with every scope picked in this session, when the user confirms the selection. */
  onSelect: (scopes: FacilityScope[]) => void;
}

export function FacilityScopePickerDialog({ open, onOpenChange, excludeIds, onSelect }: FacilityScopePickerDialogProps) {
  const { t } = useTranslation();
  const [scopes, setScopes] = useState<FacilityScope[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const lastSearchKey = useRef("");
  // Selected-so-far, keyed by id so a pick made on one page survives navigating to another.
  const [selected, setSelected] = useState<Map<number, FacilityScope>>(new Map());

  useEffect(() => {
    if (open) {
      setSearch("");
      setPage(0);
      lastSearchKey.current = "";
      setSelected(new Map());
      load(0, "");
    } else {
      setScopes([]);
      setSelected(new Map());
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
      const res = await facilityScopesService.list({
        page: p,
        size: PAGE_SIZE,
        sort_by: "code",
        code: q.trim() || undefined,
      });
      setScopes(res.data);
      setPage(p);
      setTotalPages(res.total_pages);
      setTotalElements(res.total_elements);
      setHasNext(res.has_next);
      setHasPrevious(res.has_previous);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facilityScopePicker.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(scope: FacilityScope) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(scope.id)) next.delete(scope.id);
      else next.set(scope.id, scope);
      return next;
    });
  }

  function handleConfirm() {
    if (selected.size === 0) return;
    onSelect(Array.from(selected.values()));
    onOpenChange(false);
  }

  const excluded = new Set(excludeIds ?? []);
  const selectable = scopes.filter((s) => !excluded.has(s.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogTitle className="sr-only">{t("facilityScopePicker.title")}</DialogTitle>

        {/* Header */}
        <div className="flex flex-col gap-3 px-5 pt-4 pb-4 pr-12 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t("facilityScopePicker.title")}</p>
              {totalElements > 0 && (
                <p className="text-xs text-muted-foreground">{t("facilityScopePicker.count", { n: totalElements })}</p>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("facilityScopePicker.searchPlaceholder")}
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
              {t("facilityScopePicker.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectable.map((s) => {
                const isSelected = selected.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSelect(s)}
                    aria-pressed={isSelected}
                    className={`relative text-left rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "bg-card hover:border-primary/40"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight truncate">{s.locale?.name ?? s.code}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4">
                            {s.code}
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

        {/* Confirm footer */}
        <div className="border-t px-5 py-3 shrink-0 flex items-center justify-between gap-3 bg-muted/40">
          <p className="text-xs text-muted-foreground">
            {selected.size > 0 ? t("facilityScopePicker.selectedCount", { n: selected.size }) : t("facilityScopePicker.selectHint")}
          </p>
          <Button type="button" size="sm" onClick={handleConfirm} disabled={selected.size === 0} className="gap-1.5">
            <Check className="h-3.5 w-3.5" /> {t("facilityScopePicker.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
