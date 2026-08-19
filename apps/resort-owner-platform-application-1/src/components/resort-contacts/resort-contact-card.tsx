"use client"

import { useTranslation } from "react-i18next"
import { ArrowUpRight, Globe, Mail, MessageCircle, Pencil, Phone, Star, Trash2 } from "lucide-react"
import { Button } from "@resort/shadcn-ui"
import type { ResortContact } from "@/services/resort-contacts"

export interface ContactAccent {
  bar: string
  iconBg: string
  text: string
  badge: string
}

export const CONTACT_ACCENTS: ContactAccent[] = [
  {
    bar: "bg-sky-500",
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    text: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400",
  },
  {
    bar: "bg-violet-500",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    text: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400",
  },
  {
    bar: "bg-rose-500",
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
  },
  {
    bar: "bg-amber-500",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
  },
  {
    bar: "bg-emerald-500",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  },
]

function ChannelIcon({ contact }: { contact: ResortContact }) {
  const ch = contact.communication_channel
  const cls = "size-5"
  if (ch.code === "WHATSAPP") return <MessageCircle className={cls} />
  if (ch.is_phone) return <Phone className={cls} />
  if (ch.is_email) return <Mail className={cls} />
  if (ch.is_url) return <Globe className={cls} />
  return <Phone className={cls} />
}

function getHref(contact: ResortContact): string | null {
  const ch = contact.communication_channel
  if (!ch.is_clickable) return null
  if (ch.is_phone) return `tel:${contact.contact_value.replace(/\s+/g, "")}`
  if (ch.is_email) return `mailto:${contact.contact_value}`
  if (ch.is_url) return contact.contact_value
  return null
}

interface ResortContactCardProps {
  contact: ResortContact
  accent: ContactAccent
  onEdit: () => void
  onDelete: () => void
}

export function ResortContactCard({ contact, accent, onEdit, onDelete }: ResortContactCardProps) {
  const { t } = useTranslation()
  const href = getHref(contact)
  const ch = contact.communication_channel
  const typeName = contact.contact_type.locale?.name ?? contact.contact_type.code
  const channelName = ch.locale?.name ?? ch.code
  const isExternalUrl = ch.is_url && !ch.is_phone && !ch.is_email

  const cardClass =
    "relative block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"

  const inner = (
    <div className="p-5 pt-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className={`flex size-11 items-center justify-center rounded-xl ${accent.iconBg}`}>
          <ChannelIcon contact={contact} />
        </div>
        {contact.is_primary && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${accent.badge}`}>
            <Star className="size-2.5 fill-current" />
            {t("resort.primary")}
          </span>
        )}
      </div>

      <div className="space-y-0.5 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {contact.contact_type.code} · {ch.code}
        </p>
        <p className="text-lg font-semibold tracking-tight text-card-foreground break-all leading-snug">
          {contact.contact_value}
        </p>
        <p className="text-xs text-muted-foreground">
          {typeName} {t("contacts.via")} {channelName}
        </p>
      </div>

      {href && (
        <div className={`flex items-center justify-between border-t border-border/60 pt-3.5 ${accent.text}`}>
          <span className="text-xs font-medium">
            {ch.is_phone
              ? t("contacts.tapToCall")
              : ch.is_email
                ? t("contacts.tapToEmail")
                : t("contacts.openLink")}
          </span>
          <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      )}
    </div>
  )

  return (
    <div className="group relative">
      {href ? (
        <a
          href={href}
          target={isExternalUrl ? "_blank" : undefined}
          rel={isExternalUrl ? "noopener noreferrer" : undefined}
          className={cardClass}
        >
          <div className={`absolute inset-x-0 top-0 h-[3px] ${accent.bar}`} />
          {inner}
        </a>
      ) : (
        <div className={cardClass}>
          <div className={`absolute inset-x-0 top-0 h-[3px] ${accent.bar}`} />
          {inner}
        </div>
      )}

      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          size="icon-sm"
          variant="ghost"
          className="bg-card/90 backdrop-blur-sm border border-border/60 shadow-sm"
          onClick={onEdit}
        >
          <Pencil className="size-3" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="bg-card/90 backdrop-blur-sm border border-border/60 shadow-sm text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  )
}
