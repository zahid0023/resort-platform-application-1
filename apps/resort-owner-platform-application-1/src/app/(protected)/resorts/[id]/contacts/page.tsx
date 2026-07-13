"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AlertTriangle, Loader2, Phone, Plus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Switch,
} from "@resort/shadcn-ui"
import { ResortContactCard, CONTACT_ACCENTS } from "@/components/resort-contacts/resort-contact-card"
import { resortContactsService, type ResortContact } from "@/services/resort-contacts"
import { listContactTypes, type ContactType } from "@/services/contact-types"
import { listCommunicationChannels, type CommunicationChannel } from "@/services/communication-channels"

interface ContactForm {
  contact_type_id: string
  communication_channel_id: string
  contact_value: string
  is_primary: boolean
  sort_order: string
}

const emptyForm: ContactForm = {
  contact_type_id: "",
  communication_channel_id: "",
  contact_value: "",
  is_primary: false,
  sort_order: "0",
}

export default function ContactsPage() {
  const { t } = useTranslation()
  const params = useParams()
  const resortId = Number(params.id)

  const [contacts, setContacts] = useState<ResortContact[]>([])
  const [loading, setLoading] = useState(true)
  const [contactTypes, setContactTypes] = useState<ContactType[]>([])
  const [channels, setChannels] = useState<CommunicationChannel[]>([])
  const [loadingRef, setLoadingRef] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ResortContact | null>(null)
  const [form, setForm] = useState<ContactForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<ResortContact | null>(null)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await resortContactsService.list(resortId)
      setContacts(res.data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [resortId])

  useEffect(() => {
    fetchContacts()
    listContactTypes().then((r) => setContactTypes(r.data)).catch(() => {})
    listCommunicationChannels().then((r) => setChannels(r.data)).catch(() => {})
  }, [fetchContacts])

  async function ensureRefData() {
    if (contactTypes.length > 0 && channels.length > 0) return
    setLoadingRef(true)
    try {
      const [ct, ch] = await Promise.all([listContactTypes(), listCommunicationChannels()])
      setContactTypes(ct.data)
      setChannels(ch.data)
    } catch {
      toast.error(t("resort.contactDataError"))
    } finally {
      setLoadingRef(false)
    }
  }

  async function openCreate() {
    setEditingContact(null)
    setForm({ ...emptyForm, sort_order: String(contacts.length) })
    setDialogOpen(true)
    await ensureRefData()
  }

  async function openEdit(c: ResortContact) {
    setEditingContact(c)
    setForm({
      contact_type_id: String(c.contact_type.id),
      communication_channel_id: String(c.communication_channel.id),
      contact_value: c.contact_value,
      is_primary: c.is_primary,
      sort_order: String(c.sort_order),
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingContact == null) {
      if (!form.contact_type_id || !form.communication_channel_id || !form.contact_value.trim()) {
        toast.error(t("contacts.errRequired"))
        return
      }
    } else {
      if (!form.contact_value.trim()) {
        toast.error(t("contacts.errRequired"))
        return
      }
    }
    setSubmitting(true)
    try {
      if (editingContact != null) {
        await resortContactsService.update(resortId, editingContact.id, {
          contact_value: form.contact_value.trim(),
          is_primary: form.is_primary,
          sort_order: Number(form.sort_order) || 0,
        })
        toast.success(t("contacts.updatedToast"))
      } else {
        await resortContactsService.create(resortId, {
          contact_type_id: Number(form.contact_type_id),
          communication_channel_id: Number(form.communication_channel_id),
          contact_value: form.contact_value.trim(),
          is_primary: form.is_primary,
          sort_order: Number(form.sort_order) || 0,
        })
        toast.success(t("contacts.createdToast"))
      }
      setDialogOpen(false)
      await fetchContacts()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await resortContactsService.remove(resortId, deleteTarget.id)
      toast.success(t("contacts.deletedToast"))
      setDeleteTarget(null)
      await fetchContacts()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  // Group contacts by type, ordered by type sort_order
  const groupedTypes = useMemo(() => {
    const typeMap = new Map<number, { type: ResortContact["contact_type"]; contacts: ResortContact[] }>()
    for (const c of contacts) {
      const existing = typeMap.get(c.contact_type.id)
      if (existing) {
        existing.contacts.push(c)
      } else {
        typeMap.set(c.contact_type.id, { type: c.contact_type, contacts: [c] })
      }
    }
    return Array.from(typeMap.values()).sort((a, b) => a.type.sort_order - b.type.sort_order)
  }, [contacts])

  const primaryCount = useMemo(() => contacts.filter((c) => c.is_primary).length, [contacts])
  const isEditing = editingContact != null

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Stats + action row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <StatPill label={t("contacts.statTotal")} value={contacts.length} />
          <StatPill label={t("contacts.statPrimary")} value={primaryCount} />
          <StatPill label={t("contacts.statTypes")} value={groupedTypes.length} />
        </div>
        <Button onClick={openCreate} disabled={loading}>
          <Plus className="h-4 w-4 mr-1.5" /> {t("contacts.new")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("contacts.empty")}
        </div>
      ) : (
        <div className="space-y-10">
          {groupedTypes.map(({ type, contacts: typeContacts }, idx) => {
            const accent = CONTACT_ACCENTS[idx % CONTACT_ACCENTS.length]
            const typeName = type.locales[0]?.name ?? type.code
            const typeDesc = type.locales[0]?.description
            const isEmergency = type.code === "EMERGENCY"

            return (
              <section key={type.id}>
                {/* Section header */}
                <div className="flex items-end justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-1 rounded-full ${accent.bar}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">{typeName}</h2>
                        {isEmergency && <AlertTriangle className="size-4 text-destructive" />}
                      </div>
                      {typeDesc && (
                        <p className="text-sm text-muted-foreground">{typeDesc}</p>
                      )}
                    </div>
                  </div>
                  <span className={`font-mono text-xs uppercase tracking-[0.15em] ${accent.text}`}>
                    {typeContacts.length} {typeContacts.length === 1 ? t("contacts.channel") : t("contacts.channels")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeContacts
                    .slice()
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((c) => (
                      <ResortContactCard
                        key={c.id}
                        contact={c}
                        accent={accent}
                        onEdit={() => openEdit(c)}
                        onDelete={() => setDeleteTarget(c)}
                      />
                    ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {isEditing ? t("contacts.titleEdit") : t("contacts.titleCreate")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEditing ? t("contacts.descEdit") : t("contacts.descCreate")}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {loadingRef ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {isEditing ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{t("resort.contactType")}</span>
                      <span className="text-sm font-medium">
                        {editingContact.contact_type.locales[0]?.name ?? editingContact.contact_type.code}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{t("resort.channel")}</span>
                      <span className="text-sm font-medium">
                        {editingContact.communication_channel.locales[0]?.name ?? editingContact.communication_channel.code}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label>{t("resort.contactType")} *</Label>
                      <Select
                        value={form.contact_type_id}
                        onValueChange={(v) => setForm((p) => ({ ...p, contact_type_id: v }))}
                        disabled={submitting}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("resort.contactTypePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {contactTypes.map((ct) => (
                            <SelectItem key={ct.id} value={String(ct.id)}>
                              {ct.locales[0]?.name ?? ct.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t("resort.channel")} *</Label>
                      <Select
                        value={form.communication_channel_id}
                        onValueChange={(v) => setForm((p) => ({ ...p, communication_channel_id: v }))}
                        disabled={submitting}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("resort.channelPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map((ch) => (
                            <SelectItem key={ch.id} value={String(ch.id)}>
                              {ch.locales[0]?.name ?? ch.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label>{t("resort.contactValueLabel")} *</Label>
                  <Input
                    value={form.contact_value}
                    onChange={(e) => setForm((p) => ({ ...p, contact_value: e.target.value }))}
                    placeholder={t("resort.contactValuePlaceholder")}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("field.sort")}</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                    disabled={submitting}
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <Label>{t("resort.primary")}</Label>
                  <Switch
                    size="sm"
                    checked={form.is_primary}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, is_primary: v }))}
                    disabled={submitting}
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={submitting || loadingRef}>
                {submitting
                  ? t("common.saving")
                  : isEditing
                    ? t("common.save")
                    : t("contacts.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("contacts.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("contacts.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-center min-w-[52px]">
      <p className="text-base font-bold leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  )
}
