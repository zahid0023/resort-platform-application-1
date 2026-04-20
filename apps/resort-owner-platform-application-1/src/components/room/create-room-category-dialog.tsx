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
    createRoomCategory,
    type CreateRoomCategoryRequest,
} from "@/services/room-categories";
import { createResortRoomCategory } from "@/services/resort-room-categories";

const CreateRoomCategoryDialog = ({
    open, onOpenChange, nextSortOrder, onCreated, resortId,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    nextSortOrder: number;
    onCreated: () => void;
    resortId: string;
}) => {
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [sortOrder, setSortOrder] = useState(nextSortOrder);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) setSortOrder(nextSortOrder);
    }, [open, nextSortOrder]);

    const reset = () => {
        setCode(""); setName(""); setDescription(""); setSortOrder(nextSortOrder);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || !name.trim()) {
            toast.error("Code and name are required.");
            return;
        }
        const body: CreateRoomCategoryRequest = {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            description: description.trim() || undefined,
            sort_order: sortOrder,
        };
        setSubmitting(true);
        try {
            const { id } = await createRoomCategory(body);
            await createResortRoomCategory(resortId, {
                room_category_id: id,
                sort_order: sortOrder,
            });
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
                <div className="relative bg-gradient-ocean text-primary-foreground p-8">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary-foreground/70 mb-3">
                        <Sparkles className="h-3 w-3" /> New category
                    </div>
                    <h2 className="font-display text-3xl">Curate a new collection</h2>
                </div>

                <form onSubmit={submit} className="p-8 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="c-code" className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                                <Hash className="h-3 w-3" /> Code
                            </Label>
                            <Input id="c-code" value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="OW-SUITE" className="bg-background font-mono uppercase" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="c-sort" className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                                <ListOrdered className="h-3 w-3" /> Sort order
                            </Label>
                            <Input id="c-sort" type="number" min={1} value={sortOrder}
                                onChange={(e) => setSortOrder(Math.max(1, Number(e.target.value) || 1))}
                                className="bg-background" />
                        </div>
                    </div>

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

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}
                            className="bg-gradient-ocean text-primary-foreground hover:opacity-95">
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
