"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { createResort } from "@/services/resorts"
import { listCountries, type CountrySummary } from "@/services/countries"

interface ResortDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const empty = {
  name: "",
  description: "",
  address: "",
  country_id: "",
  contact_email: "",
  contact_phone: "",
}

export function ResortDialog({ open, onOpenChange, onSuccess }: ResortDialogProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState<CountrySummary[]>([])

  useEffect(() => {
    listCountries({ size: 100, sort_by: "name", sort_dir: "ASC" })
      .then((res) => setCountries(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) setForm(empty)
  }, [open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createResort({
        name: form.name,
        description: form.description,
        country_id: Number(form.country_id),
        ...(form.address ? { address: form.address } : {}),
        ...(form.contact_email ? { contact_email: form.contact_email } : {}),
        ...(form.contact_phone ? { contact_phone: form.contact_phone } : {}),
      })
      toast.success("Resort created successfully!")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Resort</DialogTitle>
          <DialogDescription>Add a new resort to your account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name *</FieldLabel>
              <Input
                id="name" name="name" value={form.name} onChange={handleChange}
                placeholder="Sunset Beach Resort" maxLength={255} required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description *</FieldLabel>
              <textarea
                id="description" name="description" value={form.description} onChange={handleChange}
                placeholder="A beautiful beachfront resort…" rows={3} required
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="country_id">Country *</FieldLabel>
              <select
                id="country_id" name="country_id" value={form.country_id} onChange={handleChange}
                required
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input
                id="address" name="address" value={form.address} onChange={handleChange}
                placeholder="123 Ocean Drive, Boracay"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact_email">Contact Email</FieldLabel>
              <Input
                id="contact_email" name="contact_email" type="email" value={form.contact_email}
                onChange={handleChange} placeholder="info@resort.com" maxLength={255}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact_phone">Contact Phone</FieldLabel>
              <Input
                id="contact_phone" name="contact_phone" value={form.contact_phone}
                onChange={handleChange} placeholder="+63-912-345-6789" maxLength={50}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Resort"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
