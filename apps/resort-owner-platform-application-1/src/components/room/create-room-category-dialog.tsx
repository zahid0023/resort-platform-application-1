"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Hash, ListOrdered, Loader2, Sparkles, Tag } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { listRoomCategories, type RoomCategorySummary } from "@/services/room-categories";
import { createResortRoomCategory, type CreateResortRoomCategoryRequest } from "@/services/resort-room-categories";

const CreateRoomCategoryDialog = ({
    open, onOpenChange, nextSortOrder, onCreated, resortId, existingCategoryIds = [],
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    nextSortOrder: number;
    onCreated: () => void;
    resortId: string;
    existingCategoryIds?: number[];
}) => {
    const [name, setName] = useState("");
    const [roomCategoryId, setRoomCategoryId] = useState<number | null>(null);
    const [description, setDescription] = useState("");
    const [sortOrder, setSortOrder] = useState(nextSortOrder);
    const [submitting, setSubmitting] = useState(false);
    const [roomCategories, setRoomCategories] = useState<RoomCategorySummary[]>([]);
    const [roomCategoriesLoading, setRoomCategoriesLoading] = useState(false);

    useEffect(() => {
        if (open) setSortOrder(nextSortOrder);
    }, [open, nextSortOrder]);

    useEffect(() => {
        if (!open) return;
        setRoomCategoriesLoading(true);
        listRoomCategories({ size: 100 })
            .then((res) => setRoomCategories(res.data))
            .catch(() => toast.error("Failed to load room categories."))
            .finally(() => setRoomCategoriesLoading(false));
    }, [open]);

    const reset = () => {
        setName(""); setDescription(""); setSortOrder(nextSortOrder); setRoomCategoryId(null);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Name is required.");
            return;
        }
        if (!roomCategoryId) {
            toast.error("Please select a room category.");
            return;
        }
        const body: CreateResortRoomCategoryRequest = {
            room_category_id: roomCategoryId,
            name: name.trim(),
            description: description.trim() || undefined,
            sort_order: sortOrder,
        };
        setSubmitting(true);
        try {
            await createResortRoomCategory(resortId, body);
            toast.success(`${name} is now in the collection.`);
            reset();
            onOpenChange(false);
            onCreated();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
            <DialogContent className="max-w-xl p-0 overflow-hidden bg-card border-border">
                <div className="relative p-8">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] mb-3">
                        <Sparkles className="h-3 w-3" /> New category
                    </div>
                    <h2 className="text-3xl">Curate a new collection</h2>
                </div>

                <form onSubmit={submit} className="p-8 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="c-room-category" className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                                <Hash className="h-3 w-3" /> Room category
                            </Label>
                            <Select
                                value={roomCategoryId ? String(roomCategoryId) : ""}
                                onValueChange={(v) => {
                                    const id = Number(v);
                                    setRoomCategoryId(id);
                                    const rc = roomCategories.find((c) => c.id === id);
                                    if (rc) {
                                        setName(rc.name);
                                        setDescription(rc.description ?? "");
                                    }
                                }}
                                disabled={roomCategoriesLoading || roomCategories.filter((rc) => !existingCategoryIds.includes(rc.id)).length === 0}
                            >
                                <SelectTrigger id="c-room-category" className="bg-background">
                                    <SelectValue placeholder={roomCategoriesLoading ? "Loading…" : "Select a category"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roomCategories
                                        .filter((rc) => !existingCategoryIds.includes(rc.id))
                                        .map((rc) => (
                                            <SelectItem key={rc.id} value={String(rc.id)}>
                                                {rc.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {roomCategoryId && (
                            <div className="space-y-2">
                                <Label htmlFor="c-sort" className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                                    <ListOrdered className="h-3 w-3" /> Sort order
                                </Label>
                                <Input id="c-sort" type="number" min={1} value={sortOrder}
                                    onChange={(e) => setSortOrder(Math.max(1, Number(e.target.value) || 1))}
                                    className="bg-background" />
                            </div>
                        )}
                    </div>

                    {roomCategoryId && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="c-name" className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                                    <Tag className="h-3 w-3" /> Name
                                </Label>
                                <Input id="c-name" value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Overwater Suites" className="bg-background" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="c-description" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                    Description
                                </Label>
                                <Textarea id="c-description" value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3} placeholder="Suspended above the lagoon, with private deck…"
                                    className="bg-background resize-none" />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="hover:cursor-pointer">
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Add category
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateRoomCategoryDialog;
