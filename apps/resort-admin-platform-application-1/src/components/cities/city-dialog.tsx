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
import { createCity, updateCity, type City } from "@/services/cities"
import { listCountries, type CountrySummary } from "@/services/countries"

interface CityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: City | null
  onSuccess: () => void
}

const empty = { name: "", country_id: "" }

export function CityDialog({ open, onOpenChange, editing, onSuccess }: CityDialogProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState<CountrySummary[]>([])

  useEffect(() => {
    listCountries({ size: 50, sort_by: "name", sort_dir: "ASC" })
      .then(res => setCountries(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setForm(editing
      ? { name: editing.name, country_id: String(editing.country_id) }
      : empty
    )
  }, [editing, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { name: form.name, country_id: Number(form.country_id) }
      editing ? await updateCity(editing.id, payload) : await createCity(payload)
      toast.success(`City ${editing ? "updated" : "created"} successfully!`)
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
          <DialogTitle>{editing ? "Edit City" : "Create City"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update city details." : "Add a new city."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name" name="name" value={form.name} onChange={handleChange}
                placeholder="Manila" maxLength={150} required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="country_id">Country</FieldLabel>
              <select
                id="country_id"
                name="country_id"
                value={form.country_id}
                onChange={handleChange}
                required
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a country</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? (editing ? "Saving..." : "Creating...") : (editing ? "Save Changes" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
