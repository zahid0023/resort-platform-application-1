"use client"

import { Phone, Plus, X } from "lucide-react"
import { Button, Input, Switch } from "@resort/shadcn-ui"
import { useTranslation } from "react-i18next"
import { StepHeader, FieldRow, PickerField } from "./step-dialog"
import { ContactTypePickerDialog } from "@/components/contact-types/contact-type-picker-dialog"
import { CommunicationChannelPickerDialog } from "@/components/communication-channels/communication-channel-picker-dialog"
import type { ContactType } from "@/services/contact-types"
import type { CommunicationChannel } from "@/services/communication-channels"
import type { ContactRow } from "./create-resort-dialog"

export interface StepContactProps {
  contacts: ContactRow[]
  submitting: boolean
  onAdd: () => void
  onRemove: (uid: string) => void
  onUpdate: (uid: string, field: keyof Omit<ContactRow, "uid">, value: unknown) => void
  contactTypePickerForUid: string | null
  onContactTypePickerChange: (uid: string | null) => void
  channelPickerForUid: string | null
  onChannelPickerChange: (uid: string | null) => void
}

export function StepContact({
  contacts,
  submitting,
  onAdd,
  onRemove,
  onUpdate,
  contactTypePickerForUid,
  onContactTypePickerChange,
  channelPickerForUid,
  onChannelPickerChange,
}: StepContactProps) {
  const { t } = useTranslation()

  return (
    <>
      <StepHeader
        eyebrow={t("resort.step3Label")}
        title={t("resort.contact")}
        badge={{ icon: <Phone className="h-3 w-3" />, label: t("resort.contactSubtitle") }}
      />

      {contacts.length > 0 && (
        <div className="space-y-3">
          {contacts.map((row) => (
            <div
              key={row.uid}
              className="relative rounded-lg border border-border/60 bg-muted/30 p-3 pt-7 space-y-2.5"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(row.uid)}
                disabled={submitting}
                className="absolute top-1 right-1 h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>

              <PickerField
                compact
                label={t("resort.contactType")}
                value={row.contact_type_name}
                placeholder={t("resort.contactTypePlaceholder")}
                onClick={() => onContactTypePickerChange(row.uid)}
                disabled={submitting}
              />

              <PickerField
                compact
                label={t("resort.channel")}
                value={row.communication_channel_name}
                placeholder={t("resort.channelPlaceholder")}
                onClick={() => onChannelPickerChange(row.uid)}
                disabled={submitting}
              />

              <FieldRow compact label={t("resort.contactValueLabel")}>
                <Input
                  value={row.contact_value}
                  onChange={(e) => onUpdate(row.uid, "contact_value", e.target.value)}
                  placeholder={t("resort.contactValuePlaceholder")}
                  disabled={submitting}
                  className="h-8 text-sm w-full"
                />
              </FieldRow>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("resort.primary")}</span>
                <Switch
                  size="sm"
                  checked={row.is_primary}
                  onCheckedChange={(v) => onUpdate(row.uid, "is_primary", v)}
                  disabled={submitting}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        disabled={submitting}
        className="w-full border-dashed text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        {t("resort.addContact")}
      </Button>

      {contacts.length === 0 && (
        <p className="text-xs text-muted-foreground text-center -mt-1">
          {t("resort.contactsHint")}
        </p>
      )}

      <ContactTypePickerDialog
        open={contactTypePickerForUid !== null}
        onOpenChange={(o) => { if (!o) onContactTypePickerChange(null) }}
        selectedId={contacts.find((r) => r.uid === contactTypePickerForUid)?.contact_type_id ?? undefined}
        onSelect={(ct: ContactType) => {
          if (contactTypePickerForUid) {
            onUpdate(contactTypePickerForUid, "contact_type_id", ct.id)
            onUpdate(contactTypePickerForUid, "contact_type_name", ct.locales[0]?.name ?? ct.code)
          }
          onContactTypePickerChange(null)
        }}
      />

      <CommunicationChannelPickerDialog
        open={channelPickerForUid !== null}
        onOpenChange={(o) => { if (!o) onChannelPickerChange(null) }}
        selectedId={contacts.find((r) => r.uid === channelPickerForUid)?.communication_channel_id ?? undefined}
        onSelect={(ch: CommunicationChannel) => {
          if (channelPickerForUid) {
            onUpdate(channelPickerForUid, "communication_channel_id", ch.id)
            onUpdate(channelPickerForUid, "communication_channel_name", ch.locales[0]?.name ?? ch.code)
          }
          onChannelPickerChange(null)
        }}
      />
    </>
  )
}
