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
import { createCountry, updateCountry, type Country } from "@/services/countries"

interface CountryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Country | null
  onSuccess: () => void
}

const empty = { code: "", name: "" }

export function CountryDialog({ open, onOpenChange, editing, onSuccess }: CountryDialogProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm(editing ? { code: editing.code ?? "", name: editing.name ?? "" } : empty)
  }, [editing, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      editing
        ? await updateCountry(editing.id, form)
        : await createCountry(form)
      toast.success(`Country ${editing ? "updated" : "created"} successfully!`)
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
          <DialogTitle>{editing ? "Edit Country" : "Create Country"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update country details." : "Add a new country."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">Code</FieldLabel>
              <Input
                id="code" name="code" value={form.code} onChange={handleChange}
                placeholder="PH" maxLength={10}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name" name="name" value={form.name} onChange={handleChange}
                placeholder="Philippines" maxLength={100}
              />
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
