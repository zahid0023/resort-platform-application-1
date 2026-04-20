"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2Icon, CircleDashedIcon, MapPinIcon, PhoneIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import type { CountrySummary } from "@/services/countries"
import type { CitySummary } from "@/services/cities"

export type ResortFormState = {
  name: string
  description: string
  address: string
  country_id: string
  city_id: string
  contact_email: string
  contact_phone: string
}

export const emptyResortForm: ResortFormState = {
  name: "",
  description: "",
  address: "",
  country_id: "",
  city_id: "",
  contact_email: "",
  contact_phone: "",
}

export function loadDraft(key: string): Partial<ResortFormState> | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function clearDraft(key: string) {
  localStorage.removeItem(key)
}

const selectClass =
  "flex h-11 w-full rounded-xl border border-border bg-muted/40 px-4 py-2 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/50 hover:border-foreground/20 hover:bg-muted/60 focus-visible:border-foreground/30 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-foreground/[0.06] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] dark:focus-visible:bg-white/[0.03]"

const textareaClass =
  "flex w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/50 hover:border-foreground/20 hover:bg-muted/60 focus-visible:border-foreground/30 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-foreground/[0.06] disabled:cursor-not-allowed disabled:opacity-40 resize-none dark:bg-white/[0.04] dark:hover:bg-white/[0.07] dark:focus-visible:bg-white/[0.03]"

function SectionCard({ icon, title, children }: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
      <div className="flex items-center gap-2.5 border-b bg-muted/20 px-5 py-3.5">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="text-sm font-medium tracking-wide">{title}</span>
      </div>
      <div className="flex flex-col gap-5 p-5">{children}</div>
    </div>
  )
}

interface ResortFormProps {
  form: ResortFormState
  countries: CountrySummary[]
  allCities: CitySummary[]
  citiesLoading: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onDiscard: () => void
  isDirty: boolean
  submitting: boolean
  submitLabel: string
  discardLabel?: string
  /** Controls rendering mode. "view" = read-only display, "edit"/"create" = editable with draft support */
  mode: "view" | "edit" | "create"
  /** Provide a localStorage key to enable auto-save drafts (used in "edit" and "create" modes) */
  draftKey?: string
}

export function ResortForm({
  form,
  countries,
  allCities,
  citiesLoading,
  onChange,
  onSubmit,
  onDiscard,
  isDirty,
  submitting,
  submitLabel,
  discardLabel = "Discard",
  mode,
  draftKey,
}: ResortFormProps) {
  const readOnly = mode === "view"
  const filteredCities = allCities.filter((c) => c.country_id === Number(form.country_id))

  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
  const [draftFlash, setDraftFlash] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!draftKey || readOnly) return
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(form))
      setDraftSavedAt(new Date())
      setDraftFlash(true)
      setTimeout(() => setDraftFlash(false), 1500)
    }, 300)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [form, draftKey, readOnly])

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">

      <SectionCard icon={<span className="text-xs font-bold">Aa</span>} title="Basic Information">
        <Field>
          <FieldLabel htmlFor="name">
            Resort Name {!readOnly && <span className="text-destructive">*</span>}
          </FieldLabel>
          <Input
            id="name" name="name" value={form.name} onChange={onChange}
            placeholder="Sunset Beach Resort" maxLength={255} required={!readOnly}
            readOnly={readOnly} disabled={readOnly}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="description">
            Description {!readOnly && <span className="text-destructive">*</span>}
          </FieldLabel>
          <textarea
            id="description" name="description" value={form.description}
            onChange={onChange} rows={4} required={!readOnly} className={textareaClass}
            placeholder="A beautiful beachfront resort with stunning ocean views."
            readOnly={readOnly} disabled={readOnly}
          />
        </Field>
      </SectionCard>

      <SectionCard icon={<MapPinIcon className="size-3.5" />} title="Location">
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="country_id">
              Country {!readOnly && <span className="text-destructive">*</span>}
            </FieldLabel>
            <select
              id="country_id" name="country_id" value={form.country_id}
              onChange={onChange} required={!readOnly}
              disabled={readOnly}
              className={selectClass}
            >
              <option value="">Select a country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="city_id">City</FieldLabel>
            <select
              id="city_id" name="city_id" value={form.city_id}
              onChange={onChange}
              disabled={readOnly || !form.country_id || citiesLoading}
              className={selectClass}
            >
              <option value="">
                {!form.country_id ? "Select country first"
                  : citiesLoading ? "Loading…"
                  : filteredCities.length === 0 ? "No cities"
                  : "Select a city"}
              </option>
              {filteredCities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <FieldDescription>Full street address of the resort.</FieldDescription>
          <Input
            id="address" name="address" value={form.address} onChange={onChange}
            placeholder="123 Ocean Drive, Boracay"
            readOnly={readOnly} disabled={readOnly}
          />
        </Field>
      </SectionCard>

      <SectionCard icon={<PhoneIcon className="size-3.5" />} title="Contact">
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="contact_email">Email</FieldLabel>
            <Input
              id="contact_email" name="contact_email" type="email"
              value={form.contact_email} onChange={onChange}
              placeholder="info@resort.com" maxLength={255}
              readOnly={readOnly} disabled={readOnly}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="contact_phone">Phone</FieldLabel>
            <Input
              id="contact_phone" name="contact_phone"
              value={form.contact_phone} onChange={onChange}
              placeholder="+63-912-345-6789" maxLength={50}
              readOnly={readOnly} disabled={readOnly}
            />
          </Field>
        </div>
      </SectionCard>

      {!readOnly && isDirty && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-xl border bg-card px-5 py-3 shadow-lg">
          {draftKey ? (
            <div className={[
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-500",
              draftFlash
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                : "border-amber-500/40 bg-amber-500/10 text-amber-600",
            ].join(" ")}>
              {draftFlash ? (
                <><CheckCircle2Icon className="size-3.5" /> Saved</>
              ) : (
                <><CircleDashedIcon className="size-3.5 animate-spin [animation-duration:3s]" />
                  {draftSavedAt
                    ? `Draft · ${draftSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Draft loaded"}
                </>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">You have unsaved changes.</span>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={submitting} onClick={onDiscard}>
              <Trash2Icon className="size-3.5" />
              {discardLabel}
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting
                ? <><Spinner className="size-3.5" /> Saving…</>
                : <><SaveIcon className="size-3.5" /> {submitLabel}</>}
            </Button>
          </div>
        </div>
      )}

    </form>
  )
}
