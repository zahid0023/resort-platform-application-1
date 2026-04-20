"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DollarSign, ListOrdered, Loader2, Sparkles, Tag } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DatePickerField } from "@/components/ui/date-picker-field";

import { type RoomSummary } from "@/services/rooms";
import {
  createRoomPricePeriod, type CreateRoomPricePeriodRequest,
} from "@/services/room-price-periods";
import { listPriceTypes, type PriceTypeSummary } from "@/services/price-types";

/* ------------------------------------------------------------------ */
/* Set room price dialog                                               */
/* ------------------------------------------------------------------ */
const SetRoomPriceDialog = ({
  open, onOpenChange, resortId, categoryId, room,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  resortId: string;
  categoryId: number;
  room: RoomSummary;
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [price, setPrice] = useState<number>(Number(room.base_price) || 0);
  const [priority, setPriority] = useState<number>(1);
  const [priceTypeId, setPriceTypeId] = useState<number | null>(null);
  const [priceTypes, setPriceTypes] = useState<PriceTypeSummary[]>([]);
  const [priceTypesLoading, setPriceTypesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPriceTypesLoading(true);
    listPriceTypes({ size: 100 })
      .then((res) => {
        setPriceTypes(res.data);
        setPriceTypeId((cur) => cur ?? res.data[0]?.id ?? null);
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to load price types")
      )
      .finally(() => setPriceTypesLoading(false));
  }, [open]);

  const reset = () => {
    setStartDate(undefined); setEndDate(undefined);
    setPrice(Number(room.base_price) || 0); setPriority(1);
    setPriceTypeId(priceTypes[0]?.id ?? null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Pick a start and end date.");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date must be after start date.");
      return;
    }
    if (!priceTypeId) {
      toast.error("Pick a price type.");
      return;
    }
    const body: CreateRoomPricePeriodRequest = {
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      price, priority, price_type_id: priceTypeId,
    };
    setSubmitting(true);
    try {
      await createRoomPricePeriod(resortId, categoryId, room.id, body);
      toast.success(`New rate added for ${room.name}.`);
      reset();
      onOpenChange(false);
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
            <Sparkles className="h-3 w-3" /> Set price · {room.name}
          </div>
          <h2 className="font-display text-3xl">Compose a rate</h2>
        </div>

        <form onSubmit={submit} className="p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <DatePickerField
              label="Start date"
              value={startDate}
              onSelect={setStartDate}
            />
            <DatePickerField
              label="End date"
              value={endDate}
              onSelect={setEndDate}
              disabled={(date) => (startDate ? date < startDate : false)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                <DollarSign className="h-3 w-3" /> Price
              </Label>
              <Input id="price" type="number" min={0} step="0.01" value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                <ListOrdered className="h-3 w-3" /> Priority
              </Label>
              <Input id="priority" type="number" min={0} value={priority}
                onChange={(e) => setPriority(Math.max(0, Number(e.target.value) || 0))}
                className="bg-background" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
              <Tag className="h-3 w-3" /> Price type
            </Label>
            <Select
              value={priceTypeId ? String(priceTypeId) : ""}
              onValueChange={(v) => setPriceTypeId(Number(v))}
              disabled={priceTypesLoading || priceTypes.length === 0}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={priceTypesLoading ? "Loading…" : "Select a price type"} />
              </SelectTrigger>
              <SelectContent>
                {priceTypes.map((pt) => (
                  <SelectItem key={pt.id} value={String(pt.id)}>{pt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}
              className="bg-gradient-ocean text-primary-foreground hover:opacity-95">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save price
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SetRoomPriceDialog;
