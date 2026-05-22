"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { localesService, type Locale } from "@/services/locales"

interface LocaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Locale | null
  onSuccess: () => void
}

const empty = { code: "", name: "", description: "", sort_order: 0 }

export function LocaleDialog({ open, onOpenChange, editing, onSuccess }: LocaleDialogProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm(
      editing
        ? {
            code: editing.code ?? "",
            name: editing.name ?? "",
            description: editing.description ?? "",
            sort_order: editing.sort_order ?? 0,
          }
        : empty,
    )
  }, [editing, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const body = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        sort_order: Number(form.sort_order) || 0,
      }
      editing
        ? await localesService.update(editing.id, body)
        : await localesService.create(body)
      toast.success(editing ? t("localeDialog.updated") : t("localeDialog.created"))
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("localeDialog.errSubmit"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("localeDialog.edit") : t("localeDialog.create")}</DialogTitle>
          <DialogDescription>
            {editing ? t("localeDialog.descEdit") : t("localeDialog.descCreate")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">{t("common.code")} *</FieldLabel>
              <Input
                id="code"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder={t("localeDialog.codePlaceholder")}
                maxLength={50}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="name">{t("common.name")} *</FieldLabel>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t("localeDialog.namePlaceholder")}
                maxLength={255}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sort_order">{t("field.sort")} *</FieldLabel>
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                value={form.sort_order}
                onChange={handleChange}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">{t("common.description")}</FieldLabel>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t("localeDialog.descPlaceholder")}
                rows={3}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>{t("common.cancel")}</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? (editing ? t("common.saving") : t("common.creating")) : (editing ? t("common.save") : t("common.create"))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
