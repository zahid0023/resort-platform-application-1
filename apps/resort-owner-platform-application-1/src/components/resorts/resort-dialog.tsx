"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@resort/shadcn-ui"
import { Button } from "@resort/shadcn-ui"
import { Input } from "@resort/shadcn-ui"
import { Label } from "@resort/shadcn-ui"
import { Textarea } from "@resort/shadcn-ui"
import { Switch } from "@resort/shadcn-ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resort/shadcn-ui"
import { Loader2, Sparkles, ChevronLeft, ChevronRight, Globe2, MapPin, Languages, Lock, ArrowRight, Plus, X, Phone } from "lucide-react"
import { createResort } from "@/services/resorts"
import { listCountries, type CountrySummary } from "@/services/countries"
import { listCities, type CitySummary } from "@/services/cities"
import { listContactTypes, type ContactType } from "@/services/contact-types"
import { listCommunicationChannels, type CommunicationChannel } from "@/services/communication-channels"
import { createResortContact } from "@/services/resort-contacts"
import { useTranslation } from "react-i18next"
import hero from "@/assets/hero-resort.jpg"

interface ResortDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface StepOneForm {
  name: string
  description: string
  code: string
  estd: string
}

interface StepTwoForm {
  country_id: number | null
  country_name: string
  city_id: number | null
  city_name: string
  address: string
  latitude: string
  longitude: string
}

interface ContactRow {
  uid: string
  contact_type_id: number | null
  communication_channel_id: number | null
  contact_value: string
  is_primary: boolean
}

function newContactRow(): ContactRow {
  return {
    uid: Math.random().toString(36).slice(2),
    contact_type_id: null,
    communication_channel_id: null,
    contact_value: "",
    is_primary: false,
  }
}

const TOTAL_STEPS = 3

const EMPTY_STEP1: StepOneForm = { name: "", description: "", code: "", estd: "" }
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

export function ResortDialog({ open, onOpenChange, onSuccess }: ResortDialogProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [intro, setIntro] = useState(true)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [codeUserEdited, setCodeUserEdited] = useState(false)

  const [step1, setStep1] = useState<StepOneForm>(EMPTY_STEP1)
  const [step2, setStep2] = useState<StepTwoForm>(EMPTY_STEP2)

  const [countries, setCountries] = useState<CountrySummary[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [cities, setCities] = useState<CitySummary[]>([])
  const [loadingCities, setLoadingCities] = useState(false)

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [contactTypes, setContactTypes] = useState<ContactType[]>([])
  const [channels, setChannels] = useState<CommunicationChannel[]>([])
  const [loadingContactTypes, setLoadingContactTypes] = useState(false)
  const [loadingChannels, setLoadingChannels] = useState(false)

  useEffect(() => {
    if (open) {
      setIntro(true)
      setStep(1)
      setSubmitting(false)
      setCodeUserEdited(false)
      setStep1(EMPTY_STEP1)
      setStep2(EMPTY_STEP2)
      setContacts([])
      setCountries([])
      setCities([])
      setContactTypes([])
      setChannels([])
    }
  }, [open])

  const handleContactTypeSelectOpen = async (isOpen: boolean) => {
    if (!isOpen || contactTypes.length > 0) return
    setLoadingContactTypes(true)
    try {
      const res = await listContactTypes()
      setContactTypes(res.data)
    } catch {
      toast.error(t("resort.contactDataError"))
    } finally {
      setLoadingContactTypes(false)
    }
  }

  const handleChannelSelectOpen = async (isOpen: boolean) => {
    if (!isOpen || channels.length > 0) return
    setLoadingChannels(true)
    try {
      const res = await listCommunicationChannels()
      setChannels(res.data)
    } catch {
      toast.error(t("resort.contactDataError"))
    } finally {
      setLoadingChannels(false)
    }
  }

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

  const handleCountryOpenChange = async (isOpen: boolean) => {
    if (!isOpen || countries.length > 0) return
    setLoadingCountries(true)
    try {
      const res = await listCountries({ size: 20 })
      setCountries(res.data)
    } catch {
      toast.error("Failed to load countries.")
    } finally {
      setLoadingCountries(false)
    }
  }

  const handleCountrySelect = (value: string) => {
    const country = countries.find((c) => String(c.id) === value)
    if (!country) return
    setStep2((prev) => ({
      ...prev,
      country_id: country.id,
      country_name: country.name,
      city_id: null,
      city_name: "",
    }))
    setCities([])
  }

  const handleCityOpenChange = async (isOpen: boolean) => {
    if (!isOpen || !step2.country_id || cities.length > 0) return
    setLoadingCities(true)
    try {
      const res = await listCities({ countryId: step2.country_id, size: 20 })
      setCities(res.data)
    } catch {
      toast.error("Failed to load cities.")
    } finally {
      setLoadingCities(false)
    }
  }

  const handleCitySelect = (value: string) => {
    const city = cities.find((c) => String(c.id) === value)
    if (!city) return
    setStep2((prev) => ({ ...prev, city_id: city.id, city_name: city.name }))
  }

  const addContact = () => setContacts((prev) => [...prev, newContactRow()])
  const removeContact = (uid: string) => setContacts((prev) => prev.filter((r) => r.uid !== uid))
  const updateContact = (uid: string, field: keyof Omit<ContactRow, "uid">, value: unknown) =>
    setContacts((prev) => prev.map((r) => (r.uid === uid ? { ...r, [field]: value } : r)))

  const step1Valid = !!step1.name.trim() && !!step1.code.trim() && !!step1.estd.trim()
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
      const result = await createResort(step1.code.trim())
      const resortId = result.id

      for (let i = 0; i < contacts.length; i++) {
        const c = contacts[i]
        if (!c.contact_type_id || !c.communication_channel_id || !c.contact_value.trim()) continue
        try {
          await createResortContact(resortId, {
            contact_type_id: c.contact_type_id,
            communication_channel_id: c.communication_channel_id,
            contact_value: c.contact_value.trim(),
            is_primary: c.is_primary,
            sort_order: i,
          })
        } catch {
          // contact failures are non-blocking after the resort is created
        }
      }

      toast.success(t("resort.successToast"))
      onSuccess()
      onOpenChange(false)
      router.push(`/resorts/${resortId}/dashboard`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh] bg-card border-border/60">
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
            <div className="flex flex-col flex-1 min-h-0">
              <div className="px-8 pt-7 pb-6 flex-1 overflow-y-auto space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("resort.gettingStarted")}</p>
                  <h2 className="text-2xl font-semibold mt-1">{t("resort.introTitle")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{t("resort.introSubtitle")}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Globe2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t("resort.introBullet1Title")}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{t("resort.introBullet1Desc")}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Languages className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t("resort.introBullet2Title")}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{t("resort.introBullet2Desc")}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t("resort.introBullet3Title")}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{t("resort.introBullet3Desc")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 border-t border-border/60 flex items-center justify-between gap-4 bg-background/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("resort.cancel")}
                </Button>
                <Button type="button" onClick={() => setIntro(false)} className="min-w-[180px] shrink-0">
                  {t("resort.introAction")}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
          <form onSubmit={step < TOTAL_STEPS ? handleNext : handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-8 pt-7 pb-6 flex-1 overflow-y-auto space-y-5">

              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${i + 1 <= step ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-1 shrink-0">{step} / {TOTAL_STEPS}</span>
              </div>

              {/* ── Step 1 ── */}
              {step === 1 && (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("resort.step1Label")}</p>
                    <h2 className="text-2xl font-semibold mt-1">{t("resort.basicInfo")}</h2>
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                      <Globe2 className="h-3 w-3" />
                      {t("resort.enDefault")}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t("resort.nameLabel")}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={step1.name}
                      onChange={handleStep1Change}
                      placeholder={t("resort.namePlaceholder")}
                      maxLength={200}
                      disabled={submitting}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="description">{t("resort.descriptionLabel")}</Label>
                      <span className="text-xs text-muted-foreground">{t("resort.optional")}</span>
                    </div>
                    <Textarea
                      id="description"
                      name="description"
                      value={step1.description}
                      onChange={handleStep1Change}
                      placeholder={t("resort.descriptionPlaceholder")}
                      maxLength={400}
                      rows={2}
                      disabled={submitting}
                    />
                    <p className="text-xs text-muted-foreground">{t("resort.enOnlyHint")}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="code">{t("resort.code")}</Label>
                      {!codeUserEdited && step1.code && (
                        <span className="text-[10px] text-muted-foreground">{t("resort.autoFilledHint")}</span>
                      )}
                    </div>
                    <Input
                      id="code"
                      name="code"
                      value={step1.code}
                      onChange={handleStep1Change}
                      placeholder="e.g. SUNSET-RESORT"
                      maxLength={50}
                      disabled={submitting}
                    />
                    <p className="text-xs text-muted-foreground">{t("resort.codeHint")}</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="estd">{t("resort.estd")}</Label>
                    <Input
                      id="estd"
                      name="estd"
                      type="number"
                      value={step1.estd}
                      onChange={handleStep1Change}
                      placeholder="e.g. 1998"
                      min={1800}
                      max={new Date().getFullYear()}
                      disabled={submitting}
                    />
                  </div>
                </>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("resort.step2Label")}</p>
                    <h2 className="text-2xl font-semibold mt-1">{t("resort.location")}</h2>
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                      <MapPin className="h-3 w-3" />
                      {t("resort.locationSubtitle")}
                    </span>
                  </div>

                  {/* Country — required, global */}
                  <div className="space-y-1.5">
                    <Label>{t("resort.country")}</Label>
                    <Select
                      value={step2.country_id ? String(step2.country_id) : ""}
                      onValueChange={handleCountrySelect}
                      onOpenChange={handleCountryOpenChange}
                      disabled={submitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("resort.countryPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCountries ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          countries.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City — required, global */}
                  <div className="space-y-1.5">
                    <Label>{t("resort.city")}</Label>
                    <Select
                      value={step2.city_id ? String(step2.city_id) : ""}
                      onValueChange={handleCitySelect}
                      onOpenChange={handleCityOpenChange}
                      disabled={!step2.country_id || submitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={step2.country_id ? t("resort.cityPlaceholder") : t("resort.cityAfterCountry")} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCities ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          cities.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Address — EN badge, locale-specific text */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="address">{t("resort.address")}</Label>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 leading-none">EN</span>
                      <span className="text-xs text-muted-foreground">{t("resort.optional")}</span>
                    </div>
                    <Textarea
                      id="address"
                      name="address"
                      value={step2.address}
                      onChange={handleStep2Change}
                      placeholder={t("resort.addressPlaceholder")}
                      maxLength={400}
                      rows={2}
                      disabled={submitting}
                    />
                  </div>

                  {/* Lat / Lon — global numeric */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="lat2">{t("resort.latitude")}</Label>
                        <span className="text-xs text-muted-foreground">{t("resort.optional")}</span>
                      </div>
                      <Input
                        id="lat2"
                        name="latitude"
                        type="number"
                        value={step2.latitude}
                        onChange={handleStep2Change}
                        placeholder="e.g. 36.7783"
                        step="any"
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="lon2">{t("resort.longitude")}</Label>
                        <span className="text-xs text-muted-foreground">{t("resort.optional")}</span>
                      </div>
                      <Input
                        id="lon2"
                        name="longitude"
                        type="number"
                        value={step2.longitude}
                        onChange={handleStep2Change}
                        placeholder="e.g. -119.4179"
                        step="any"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 3 ── */}
              {step === 3 && (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("resort.step3Label")}</p>
                    <h2 className="text-2xl font-semibold mt-1">{t("resort.contact")}</h2>
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                      <Phone className="h-3 w-3" />
                      {t("resort.contactSubtitle")}
                    </span>
                  </div>

                  {contacts.length > 0 && (
                        <div className="space-y-3">
                          {contacts.map((row, i) => (
                            <div
                              key={row.uid}
                              className="relative rounded-lg border border-border/60 bg-muted/30 p-3 pt-7 space-y-2.5"
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeContact(row.uid)}
                                disabled={submitting}
                                className="absolute top-1.5 right-1.5 h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>

                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {t("resort.contactType")}
                                </Label>
                                <Select
                                    value={row.contact_type_id ? String(row.contact_type_id) : ""}
                                    onValueChange={(v) => updateContact(row.uid, "contact_type_id", Number(v))}
                                    onOpenChange={handleContactTypeSelectOpen}
                                    disabled={submitting}
                                  >
                                    <SelectTrigger className="h-8 text-xs w-full">
                                      <SelectValue placeholder={t("resort.contactTypePlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {loadingContactTypes ? (
                                        <div className="flex items-center justify-center py-4">
                                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                      ) : (
                                        contactTypes.map((ct) => (
                                          <SelectItem key={ct.id} value={String(ct.id)}>
                                            {ct.locales[0]?.name ?? ct.code}
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {t("resort.channel")}
                                </Label>
                                <Select
                                  value={row.communication_channel_id ? String(row.communication_channel_id) : ""}
                                  onValueChange={(v) => updateContact(row.uid, "communication_channel_id", Number(v))}
                                  onOpenChange={handleChannelSelectOpen}
                                  disabled={submitting}
                                >
                                  <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue placeholder={t("resort.channelPlaceholder")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {loadingChannels ? (
                                      <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                      </div>
                                    ) : (
                                      channels.map((ch) => (
                                        <SelectItem key={ch.id} value={String(ch.id)}>
                                          {ch.locales[0]?.name ?? ch.code}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {t("resort.contactValueLabel")}
                                </Label>
                                <Input
                                  value={row.contact_value}
                                  onChange={(e) => updateContact(row.uid, "contact_value", e.target.value)}
                                  placeholder={t("resort.contactValuePlaceholder")}
                                  disabled={submitting}
                                  className="h-8 text-sm w-full"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{t("resort.primary")}</span>
                                <Switch
                                  size="sm"
                                  checked={row.is_primary}
                                  onCheckedChange={(v) => updateContact(row.uid, "is_primary", v)}
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
                        onClick={addContact}
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
                </>
              )}

            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-border/60 flex items-center justify-between gap-4 bg-background/50">
              <Button
                type="button"
                variant="ghost"
                onClick={step === 1 ? () => onOpenChange(false) : handleBack}
                disabled={submitting}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {step === 1 ? t("resort.cancel") : t("resort.back")}
              </Button>

              {step < TOTAL_STEPS ? (
                <Button
                  type="submit"
                  disabled={step === 1 ? !step1Valid : !step2Valid}
                  className="min-w-[140px] shrink-0"
                >
                  {t("resort.next")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={!step3Valid || submitting} className="min-w-[140px] shrink-0">
                  {submitting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Sparkles className="h-4 w-4 mr-1" />{t("resort.submit")}</>
                  }
                </Button>
              )}
            </div>
          </form>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
