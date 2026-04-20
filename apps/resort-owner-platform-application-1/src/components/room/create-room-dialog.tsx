"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Baby, Building2, DollarSign, Hash, Loader2, Sparkles, Tag, Users } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createRoom, type CreateRoomRequest } from "@/services/rooms";

const CreateRoomDialog = ({
  open, onOpenChange, resortId, categoryId, categoryName, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  resortId: string;
  categoryId: number;
  categoryName: string;
  onCreated: () => void;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState(1);
  const [maxAdults, setMaxAdults] = useState(2);
  const [maxChildren, setMaxChildren] = useState(0);
  const [basePrice, setBasePrice] = useState(500);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName(""); setDescription(""); setRoomNumber("");
    setFloor(1); setMaxAdults(2); setMaxChildren(0); setBasePrice(500);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    const body: CreateRoomRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      room_number: roomNumber.trim() || undefined,
      floor,
      max_adults: maxAdults,
      max_children: maxChildren,
      base_price: basePrice.toFixed(2),
    };
    setSubmitting(true);
    try {
      await createRoom(resortId, categoryId, body);
      toast.success(`${name} is now part of ${categoryName}.`);
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
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-border">
        <div className="relative bg-gradient-ocean text-primary-foreground p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary-foreground/70 mb-3">
            <Sparkles className="h-3 w-3" /> New room · {categoryName}
          </div>
          <h2 className="font-display text-3xl">Compose a new stay</h2>
        </div>

        <form onSubmit={submit} className="p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="r-name" className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                <Tag className="h-3 w-3" /> Name
              </Label>
              <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Lagoon Suite 04" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber" className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                <Hash className="h-3 w-3" /> Room number
              </Label>
              <Input id="roomNumber" value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="OW-04" className="bg-background font-mono" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="r-description" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Description
            </Label>
            <Textarea id="r-description" value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3} className="bg-background resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="floor" className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                <Building2 className="h-3 w-3" /> Floor
              </Label>
              <Input id="floor" type="number" value={floor}
                onChange={(e) => setFloor(Number(e.target.value) || 0)}
                className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePrice" className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                <DollarSign className="h-3 w-3" /> Base price
              </Label>
              <Input id="basePrice" type="number" min={0} step="0.01" value={basePrice}
                onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value) || 0))}
                className="bg-background" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                <Users className="h-3 w-3" /> Max adults
              </Label>
              <Input type="number" min={1} value={maxAdults}
                onChange={(e) => setMaxAdults(Math.max(1, Number(e.target.value) || 1))}
                className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                <Baby className="h-3 w-3" /> Max children
              </Label>
              <Input type="number" min={0} value={maxChildren}
                onChange={(e) => setMaxChildren(Math.max(0, Number(e.target.value) || 0))}
                className="bg-background" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}
              className="bg-gradient-ocean text-primary-foreground hover:opacity-95">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
