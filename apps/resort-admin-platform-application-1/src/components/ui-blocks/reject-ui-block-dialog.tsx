"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { listPageTypes, type PageTypeSummary } from "@/services/page-types";
import { listUiBlockCategories, type UiBlockCategory } from "@/services/ui-block-categories";
import { createUiBlockDefinition } from "@/services/ui-block-definitions";
import type { UiBlockSchema } from "ui-blocks";

interface RejectUiBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockKey: string;
  blockName: string;
  blockDescription: string;
  blockSchema: UiBlockSchema;
  blockDefaults: Record<string, unknown>;
}

interface SchemaWarnings {
  pageType: string | null;
  category: string | null;
  allowedPages: string[];
}

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function SchemaWarning({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-1.5 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
      <span className="mt-px shrink-0">⚠</span>
      <span>{message}</span>
    </p>
  );
}

export function RejectUiBlockDialog({
  open,
  onOpenChange,
  blockKey,
  blockName,
  blockDescription,
  blockSchema,
  blockDefaults,
}: RejectUiBlockDialogProps) {
  const [pageTypes, setPageTypes] = useState<PageTypeSummary[]>([]);
  const [categories, setCategories] = useState<UiBlockCategory[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warnings, setWarnings] = useState<SchemaWarnings>({
    pageType: null,
    category: null,
    allowedPages: [],
  });

  const [form, setForm] = useState({
    page_type_id: "",
    ui_block_category_id: "",
    name: blockName,
    description: blockDescription,
    ui_block_version: "1.0.0",
  });

  const [selectedAllowedPages, setSelectedAllowedPages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;

    setForm({
      page_type_id: "",
      ui_block_category_id: "",
      name: blockName,
      description: blockDescription,
      ui_block_version: "1.0.0",
    });
    setSelectedAllowedPages(new Set());
    setWarnings({ pageType: null, category: null, allowedPages: [] });

    setLoadingData(true);
    Promise.all([
      listPageTypes({ size: 100 }),
      listUiBlockCategories({ size: 100 }),
    ])
      .then(([pt, cat]) => {
        setPageTypes(pt.data);
        setCategories(cat.data);

        const newWarnings: SchemaWarnings = { pageType: null, category: null, allowedPages: [] };

        if (blockSchema.pageType) {
          const matched = pt.data.find((p) => p.key === blockSchema.pageType);
          if (matched) {
            setForm((prev) => ({ ...prev, page_type_id: String(matched.id) }));
          } else {
            newWarnings.pageType = blockSchema.pageType;
          }
        }

        if (blockSchema.category) {
          const matched = cat.data.find((c) => c.key === blockSchema.category);
          if (matched) {
            setForm((prev) => ({ ...prev, ui_block_category_id: String(matched.id) }));
          } else {
            newWarnings.category = blockSchema.category;
          }
        }

        if (blockSchema.allowedPages?.length) {
          const dbKeySet = new Set(pt.data.map((p) => p.key));
          const preChecked = new Set<string>();
          const unmatched: string[] = [];

          for (const page of blockSchema.allowedPages) {
            if (dbKeySet.has(page)) {
              preChecked.add(page);
            } else {
              unmatched.push(page);
            }
          }

          setSelectedAllowedPages(preChecked);
          newWarnings.allowedPages = unmatched;
        }

        setWarnings(newWarnings);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load options.");
      })
      .finally(() => setLoadingData(false));
  }, [open, blockName, blockDescription, blockSchema]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleAllowedPage(key: string) {
    setSelectedAllowedPages((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.page_type_id || !form.ui_block_category_id) {
      toast.error("Please select a page type and category.");
      return;
    }
    setSubmitting(true);
    try {
      await createUiBlockDefinition({
        ui_block_key: blockKey,
        name: form.name,
        description: form.description,
        ui_block_version: form.ui_block_version,
        page_type_id: Number(form.page_type_id),
        ui_block_category_id: Number(form.ui_block_category_id),
        editable_schema: Object.fromEntries(
          blockSchema.props.map((p) => [
            p.name,
            {
              type: p.type,
              ...(p.options ? { options: p.options } : {}),
            },
          ])
        ),
        default_content: blockDefaults,
        allowed_pages: Array.from(selectedAllowedPages),
        is_accepted: false,
      });
      toast.success("UI block definition rejected and saved!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasWarnings =
    warnings.pageType !== null ||
    warnings.category !== null ||
    warnings.allowedPages.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reject UI Block</DialogTitle>
          <DialogDescription>
            Save this UI block definition as rejected.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading options…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {hasWarnings && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                  schema.json mismatches — update the schema to fix these:
                </p>
                {warnings.pageType && (
                  <SchemaWarning
                    message={`pageType: "${warnings.pageType}" does not match any page_type.key in the database.`}
                  />
                )}
                {warnings.category && (
                  <SchemaWarning
                    message={`category: "${warnings.category}" does not match any ui_block_category.name or .key in the database.`}
                  />
                )}
                {warnings.allowedPages.map((page) => (
                  <SchemaWarning
                    key={page}
                    message={`allowedPages: "${page}" does not match any page_type.key in the database.`}
                  />
                ))}
              </div>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="page_type_id">Page Type</FieldLabel>
                <select
                  id="page_type_id"
                  name="page_type_id"
                  value={form.page_type_id}
                  onChange={handleChange}
                  className={selectClass}
                  required
                >
                  <option value="">Select page type…</option>
                  {pageTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} ({pt.key})
                    </option>
                  ))}
                </select>
                {warnings.pageType && (
                  <FieldDescription className="text-yellow-700 dark:text-yellow-400">
                    No auto-match for &quot;{warnings.pageType}&quot; — select manually.
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="ui_block_category_id">Category</FieldLabel>
                <select
                  id="ui_block_category_id"
                  name="ui_block_category_id"
                  value={form.ui_block_category_id}
                  onChange={handleChange}
                  className={selectClass}
                  required
                >
                  <option value="">Select category…</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.key})
                    </option>
                  ))}
                </select>
                {warnings.category && (
                  <FieldDescription className="text-yellow-700 dark:text-yellow-400">
                    No auto-match for &quot;{warnings.category}&quot; — select manually.
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="ui_block_version">Version</FieldLabel>
                <Input
                  id="ui_block_version"
                  name="ui_block_version"
                  value={form.ui_block_version}
                  onChange={handleChange}
                  placeholder="1.0.0"
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Allowed Pages</FieldLabel>
                {pageTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No page types found in database.</p>
                ) : (
                  <div className="flex flex-col gap-2 rounded-md border border-input bg-background px-3 py-2">
                    {pageTypes.map((pt) => (
                      <label key={pt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAllowedPages.has(pt.key)}
                          onChange={() => toggleAllowedPage(pt.key)}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <span>{pt.name}</span>
                        <span className="text-xs text-muted-foreground">({pt.key})</span>
                      </label>
                    ))}
                  </div>
                )}
                <FieldDescription>
                  Only page types that exist in the database are selectable.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={submitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting ? "Saving…" : "Reject & Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
