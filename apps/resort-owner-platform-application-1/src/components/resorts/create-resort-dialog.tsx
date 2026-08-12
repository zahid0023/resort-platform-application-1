"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTitle } from "@resort/shadcn-ui"
import { createResort } from "@/services/resorts"
import type { Country } from "@/services/countries"
import type { City } from "@/services/cities"
import { localesService } from "@/services/locales"
import { useTranslation } from "react-i18next"
import hero from "@/assets/hero-resort.jpg"
import { WelcomeStep } from "./welcome-step"
import { WizardForm } from "./wizard-form"

interface CreateResortDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export interface StepOneForm {
  name: string
  tagline: string
  short_description: string
  code: string
  estd: string
}

export interface StepTwoForm {
  country_id: number | null
  country_name: string
  city_id: number | null
  city_name: string
  address: string
  latitude: string
  longitude: string
}

export interface ContactRow {
  uid: string
  contact_type_id: number | null
  contact_type_name: string
  communication_channel_id: number | null
  communication_channel_name: string
  contact_value: string
  is_primary: boolean
}

function newContactRow(): ContactRow {
  return {
    uid: Math.random().toString(36).slice(2),
    contact_type_id: null,
    contact_type_name: "",
    communication_channel_id: null,
    communication_channel_name: "",
    contact_value: "",
    is_primary: false,
  }
}

const TOTAL_STEPS = 3

const EMPTY_STEP1: StepOneForm = { name: "", tagline: "", short_description: "", code: "", estd: "" }
const EMPTY_STEP2: StepTwoForm = {
  country_id: null,
  country_name: "",
  city_id: null,
  city_name: "",
  address: "",
  latitude: "",
  longitude: "",
}

function nameToCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50)
}

export function CreateResortDialog({ open, onOpenChange, onSuccess }: CreateResortDialogProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [intro, setIntro] = useState(true)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [codeUserEdited, setCodeUserEdited] = useState(false)

  const [step1, setStep1] = useState<StepOneForm>(EMPTY_STEP1)
  const [step2, setStep2] = useState<StepTwoForm>(EMPTY_STEP2)

  const [countryPickerOpen, setCountryPickerOpen] = useState(false)
  const [cityPickerOpen, setCityPickerOpen] = useState(false)
  const [contactTypePickerForUid, setContactTypePickerForUid] = useState<string | null>(null)
  const [channelPickerForUid, setChannelPickerForUid] = useState<string | null>(null)

  const [contacts, setContacts] = useState<ContactRow[]>([])

  const [enLocaleId, setEnLocaleId] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      setIntro(true)
      setStep(1)
      setSubmitting(false)
      setCodeUserEdited(false)
      setStep1(EMPTY_STEP1)
      setStep2(EMPTY_STEP2)
      setContacts([])
      setCountryPickerOpen(false)
      setCityPickerOpen(false)
      setContactTypePickerForUid(null)
      setChannelPickerForUid(null)
      localesService.list({ code: "en", size: 1 }).then((res) => {
        setEnLocaleId(res.data[0]?.id ?? null)
      }).catch(() => {
        // locale fetch failure is non-blocking; basic_info will be created without locale rows
      })
    }
  }, [open])

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === "code") {
      setCodeUserEdited(true)
      setStep1((prev) => ({ ...prev, code: value }))
    } else if (name === "name") {
      setStep1((prev) => ({
        ...prev,
        name: value,
        code: codeUserEdited ? prev.code : nameToCode(value),
      }))
    } else {
      setStep1((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setStep2((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleCountrySelect = (country: Country) => {
    setStep2((prev) => ({
      ...prev,
      country_id: country.id,
      country_name: country.locale?.name ?? country.code,
      city_id: null,
      city_name: "",
    }))
    setCityPickerOpen(true)
  }

  const handleCitySelect = (city: City) => {
    setStep2((prev) => ({
      ...prev,
      city_id: city.id,
      city_name: city.locale?.name ?? city.code ?? String(city.id),
    }))
  }

  const addContact = () => setContacts((prev) => [...prev, newContactRow()])
  const removeContact = (uid: string) => setContacts((prev) => prev.filter((r) => r.uid !== uid))
  const updateContact = (uid: string, field: keyof Omit<ContactRow, "uid">, value: unknown) =>
    setContacts((prev) => prev.map((r) => (r.uid === uid ? { ...r, [field]: value } : r)))

  const step1Valid = !!step1.name.trim() && !!step1.tagline.trim() && !!step1.code.trim() && !!step1.estd.trim()
  const step2Valid = !!step2.country_id && !!step2.city_id
  const step3Valid = contacts.every(
    (c) => !!c.contact_type_id && !!c.communication_channel_id && !!c.contact_value.trim()
  )

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1 && step1Valid) setStep(2)
    else if (step === 2 && step2Valid) setStep(3)
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!step3Valid || submitting) return
    setSubmitting(true)
    try {
      const localeRows = enLocaleId
        ? [{
            locale_id: enLocaleId,
            sort_order: 1,
            name: step1.name.trim(),
            tagline: step1.tagline.trim(),
            short_description: step1.short_description.trim() || undefined,
            address: step2.address.trim() || undefined,
          }]
        : undefined

      const result = await createResort({
        code: step1.code.trim(),
        basic_info: {
          code: step1.code.trim().slice(0, 50),
          sort_order: 1,
          estd: Number(step1.estd),
          country_id: step2.country_id!,
          city_id: step2.city_id!,
          lat: step2.latitude ? Number(step2.latitude) : undefined,
          lon: step2.longitude ? Number(step2.longitude) : undefined,
          locales: localeRows,
        },
        contacts: contacts
          .filter((c) => c.contact_type_id && c.communication_channel_id && c.contact_value.trim())
          .map((c, i) => ({
            contact_type_id: c.contact_type_id!,
            communication_channel_id: c.communication_channel_id!,
            contact_value: c.contact_value.trim(),
            is_primary: c.is_primary,
            sort_order: i,
          })),
      })

      toast.success(t("resort.successToast"))
      onSuccess()
      onOpenChange(false)
      router.push(`/resorts/${result.id}/dashboard`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] bg-card border-border/60">
        <DialogTitle className="sr-only">Create Resort</DialogTitle>
        <div className="grid md:grid-cols-[260px_1fr] flex-1 min-h-0">

          {/* Left rail */}
          <aside className="relative hidden md:block overflow-hidden">
            <img src={hero.src} alt="Resort" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/40 to-primary/90" />
            <div className="relative h-full flex flex-col justify-between p-6 text-primary-foreground">
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">{t("resort.newDestination")}</p>
              <div className="space-y-1">
                <p className="text-xl font-semibold leading-tight line-clamp-2">
                  {step1.name || "Resort name"}
                </p>
                {step1.code && (
                  <p className="text-xs opacity-70 uppercase tracking-widest">{step1.code}</p>
                )}
                {step2.city_name && (
                  <p className="text-xs opacity-60">
                    {[step2.city_name, step2.country_name].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Right — intro or form */}
          {intro ? (
            <WelcomeStep onCancel={() => onOpenChange(false)} onNext={() => setIntro(false)} />
          ) : (
            <WizardForm
              step={step}
              totalSteps={TOTAL_STEPS}
              onSubmit={step < TOTAL_STEPS ? handleNext : handleSubmit}
              basicInfoProps={{
                form: step1,
                codeUserEdited,
                submitting,
                onChange: handleStep1Change,
              }}
              locationProps={{
                form: step2,
                submitting,
                onChange: handleStep2Change,
                onCountrySelect: handleCountrySelect,
                onCitySelect: handleCitySelect,
                countryPickerOpen,
                onCountryPickerOpenChange: setCountryPickerOpen,
                cityPickerOpen,
                onCityPickerOpenChange: setCityPickerOpen,
              }}
              contactProps={{
                contacts,
                submitting,
                onAdd: addContact,
                onRemove: removeContact,
                onUpdate: updateContact,
                contactTypePickerForUid,
                onContactTypePickerChange: setContactTypePickerForUid,
                channelPickerForUid,
                onChannelPickerChange: setChannelPickerForUid,
              }}
              footerProps={{
                backLabel: t("resort.back"),
                cancelLabel: t("resort.cancel"),
                nextLabel: t("resort.next"),
                submitLabel: t("resort.submit"),
                onBack: handleBack,
                onCancel: () => onOpenChange(false),
                nextDisabled: step === 1 ? !step1Valid : !step2Valid,
                submitDisabled: !step3Valid || submitting,
                submitting,
              }}
            />
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
