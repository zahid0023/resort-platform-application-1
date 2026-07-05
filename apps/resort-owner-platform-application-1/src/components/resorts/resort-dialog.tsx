"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@resort/shadcn-ui"
import { Button } from "@resort/shadcn-ui"
import { Input } from "@resort/shadcn-ui"
import { Label } from "@resort/shadcn-ui"
import { Textarea } from "@resort/shadcn-ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resort/shadcn-ui"
import { Loader2, Sparkles, ChevronLeft, ChevronRight, Globe2, Languages } from "lucide-react"
import { createResort } from "@/services/resorts"
import { listCountries, type CountrySummary } from "@/services/countries"
import { listCities, type CitySummary } from "@/services/cities"
import { useTranslation } from "react-i18next"
import hero from "@/assets/hero-resort.jpg"

interface ResortDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface StepOneForm {
  code: string
  estd: string
  email: string
  phone: string
  latitude: string
  longitude: string
}

interface StepTwoForm {
  country_id: number | null
  country_name: string
  city_id: number | null
  city_name: string
  address: string
  zip: string
}

const TOTAL_STEPS = 2

const EMPTY_STEP1: StepOneForm = { code: "", estd: "", email: "", phone: "", latitude: "", longitude: "" }
const EMPTY_STEP2: StepTwoForm = {
  country_id: null,
  country_name: "",
  city_id: null,
  city_name: "",
  address: "",
  zip: "",
}

export function ResortDialog({ open, onOpenChange, onSuccess }: ResortDialogProps) {
  const router = useRouter()
  const { i18n } = useTranslation()
  const currentLocale = (i18n.resolvedLanguage ?? i18n.language ?? "en").toUpperCase()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  const [step1, setStep1] = useState<StepOneForm>(EMPTY_STEP1)
  const [step2, setStep2] = useState<StepTwoForm>(EMPTY_STEP2)

  const [countries, setCountries] = useState<CountrySummary[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [cities, setCities] = useState<CitySummary[]>([])
  const [loadingCities, setLoadingCities] = useState(false)

  useEffect(() => {
    if (open) {
      setStep(1)
      setSubmitting(false)
      setStep1(EMPTY_STEP1)
      setStep2(EMPTY_STEP2)
      setCountries([])
      setCities([])
      setTimeout(() => codeRef.current?.focus(), 50)
    }
  }, [open])

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setStep1((prev) => ({ ...prev, [e.target.name]: e.target.value }))

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

  const step1Valid =
    !!step1.code.trim() && !!step1.estd.trim() && !!step1.email.trim() && !!step1.phone.trim() && !!step1.latitude.trim() && !!step1.longitude.trim()

  const step2Valid =
    !!step2.country_id && !!step2.city_id && !!step2.address.trim() && !!step2.zip.trim()

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1 && step1Valid) setStep(2)
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!step2Valid || submitting) return
    setSubmitting(true)
    try {
      const result = await createResort(step1.code.trim())
      toast.success("Resort created!")
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
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh] bg-card border-border/60">
        <div className="grid md:grid-cols-[260px_1fr] flex-1 min-h-0">

          {/* Left rail */}
          <aside className="relative hidden md:block overflow-hidden">
            <img src={hero.src} alt="Resort" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/40 to-primary/90" />
            <div className="relative h-full flex flex-col justify-between p-6 text-primary-foreground">
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">New destination</p>
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

          {/* Right — form */}
          <form onSubmit={step === 1 ? handleNext : handleSubmit} className="flex flex-col flex-1 min-h-0">
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
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step 1</p>
                    <h2 className="text-2xl font-semibold mt-1">Basic information</h2>
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                      <Globe2 className="h-3 w-3" />
                      Global · applies to all languages
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="code">Resort code</Label>
                    <Input
                      ref={codeRef}
                      id="code"
                      name="code"
                      value={step1.code}
                      onChange={handleStep1Change}
                      placeholder="e.g. SUNSET-RESORT"
                      maxLength={100}
                      disabled={submitting}
                    />
                    <p className="text-xs text-muted-foreground">Unique identifier — cannot be changed after creation.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="estd">Established year</Label>
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

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={step1.email}
                      onChange={handleStep1Change}
                      placeholder="contact@resort.com"
                      maxLength={200}
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={step1.phone}
                      onChange={handleStep1Change}
                      placeholder="+1 000 000 0000"
                      maxLength={50}
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        name="latitude"
                        type="number"
                        value={step1.latitude}
                        onChange={handleStep1Change}
                        placeholder="e.g. 36.7783"
                        step="any"
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        name="longitude"
                        type="number"
                        value={step1.longitude}
                        onChange={handleStep1Change}
                        placeholder="e.g. -119.4179"
                        step="any"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step 2</p>
                    <h2 className="text-2xl font-semibold mt-1">Address</h2>
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                      <Languages className="h-3 w-3" />
                      Locale-specific · {currentLocale}
                    </span>
                  </div>

                  {/* Country */}
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Select
                      value={step2.country_id ? String(step2.country_id) : ""}
                      onValueChange={handleCountrySelect}
                      onOpenChange={handleCountryOpenChange}
                      disabled={submitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCountries ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          countries.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Select
                      value={step2.city_id ? String(step2.city_id) : ""}
                      onValueChange={handleCitySelect}
                      onOpenChange={handleCityOpenChange}
                      disabled={!step2.country_id || submitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={step2.country_id ? "Select a city" : "Select a country first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCities ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          cities.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={step2.address}
                      onChange={handleStep2Change}
                      placeholder="Full address…"
                      maxLength={400}
                      rows={2}
                      disabled={submitting}
                    />
                  </div>

                  {/* ZIP */}
                  <div className="space-y-1.5">
                    <Label htmlFor="zip">ZIP / Postal code</Label>
                    <Input
                      id="zip"
                      name="zip"
                      value={step2.zip}
                      onChange={handleStep2Change}
                      placeholder="00000"
                      maxLength={20}
                      disabled={submitting}
                    />
                  </div>
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
                {step === 1 ? "Cancel" : "Back"}
              </Button>

              {step < TOTAL_STEPS ? (
                <Button type="submit" disabled={!step1Valid} className="min-w-[140px] shrink-0">
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={!step2Valid || submitting} className="min-w-[140px] shrink-0">
                  {submitting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Sparkles className="h-4 w-4 mr-1" /> Create resort</>
                  }
                </Button>
              )}
            </div>
          </form>

        </div>
      </DialogContent>
    </Dialog>
  )
}
