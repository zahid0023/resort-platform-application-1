"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AlertTriangle, ChevronDown, Phone, Plus } from "lucide-react"
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
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Spinner,
  Switch,
} from "@resort/shadcn-ui"
import { ResortContactCard, CONTACT_ACCENTS } from "@/components/resort-contacts/resort-contact-card"
import { ContactTypePickerDialog } from "@/components/contact-types/contact-type-picker-dialog"
import { CommunicationChannelPickerDialog } from "@/components/communication-channels/communication-channel-picker-dialog"
import { resortContactsService, type ResortContact } from "@/services/resort-contacts"
import type { ContactType } from "@/services/contact-types"
import type { CommunicationChannel } from "@/services/communication-channels"

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

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ResortContact | null>(null)
  const [form, setForm] = useState<ContactForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const [contactTypePickerOpen, setContactTypePickerOpen] = useState(false)
  const [selectedContactType, setSelectedContactType] = useState<ContactType | null>(null)
  const [channelPickerOpen, setChannelPickerOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel | null>(null)

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
  }, [fetchContacts])

  function openCreate() {
    setEditingContact(null)
    setSelectedContactType(null)
    setSelectedChannel(null)
    setForm({ ...emptyForm, sort_order: String(contacts.length) })
    setDialogOpen(true)
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
            const typeName = type.locale?.name ?? type.code
            const typeDesc = type.locale?.description
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

      {/* Create / Edit Sheet */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="p-0 gap-0 flex flex-col sm:max-w-md">
          <SheetHeader className="flex-row items-center gap-3 border-b p-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-sm">
                {isEditing ? t("contacts.titleEdit") : t("contacts.titleCreate")}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">
                {isEditing ? t("contacts.descEdit") : t("contacts.descCreate")}
              </p>
            </div>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                {isEditing ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{t("resort.contactType")}</span>
                      <span className="text-sm font-medium">
                        {editingContact.contact_type.locale?.name ?? editingContact.contact_type.code}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{t("resort.channel")}</span>
                      <span className="text-sm font-medium">
                        {editingContact.communication_channel.locale?.name ?? editingContact.communication_channel.code}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label>{t("resort.contactType")} *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal"
                        onClick={() => setContactTypePickerOpen(true)}
                        disabled={submitting}
                      >
                        <span className={selectedContactType ? "" : "text-muted-foreground"}>
                          {selectedContactType
                            ? (selectedContactType.locale?.name ?? selectedContactType.code)
                            : t("resort.contactTypePlaceholder")}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                      <ContactTypePickerDialog
                        open={contactTypePickerOpen}
                        onOpenChange={setContactTypePickerOpen}
                        selectedId={selectedContactType?.id}
                        onSelect={(ct) => {
                          setSelectedContactType(ct)
                          setForm((p) => ({ ...p, contact_type_id: String(ct.id) }))
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t("resort.channel")} *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal"
                        onClick={() => setChannelPickerOpen(true)}
                        disabled={submitting}
                      >
                        <span className={selectedChannel ? "" : "text-muted-foreground"}>
                          {selectedChannel
                            ? (selectedChannel.locale?.name ?? selectedChannel.code)
                            : t("resort.channelPlaceholder")}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                      <CommunicationChannelPickerDialog
                        open={channelPickerOpen}
                        onOpenChange={setChannelPickerOpen}
                        selectedId={selectedChannel?.id}
                        onSelect={(ch) => {
                          setSelectedChannel(ch)
                          setForm((p) => ({ ...p, communication_channel_id: String(ch.id) }))
                        }}
                      />
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
                  <Label>{t("resort.contactSortLabel")}</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                    disabled={submitting}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="space-y-0.5">
                    <Label>{t("resort.primary")}</Label>
                    <p className="text-xs text-muted-foreground">{t("resort.primaryHint")}</p>
                  </div>
                  <Switch
                    size="sm"
                    checked={form.is_primary}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, is_primary: v }))}
                    disabled={submitting}
                  />
                </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? t("common.saving")
                : isEditing
                  ? t("common.save")
                  : t("contacts.create")}
            </Button>
          </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

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
