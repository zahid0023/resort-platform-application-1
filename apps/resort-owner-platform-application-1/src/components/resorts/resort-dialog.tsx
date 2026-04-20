"use client"

import { useMemo, useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Check, CheckCircle2, ChevronLeft, ChevronRight,
  CircleDashed, MapPin, Sparkles, Mail, Phone,
  Home, Globe2, Building2, Trash2, ImagePlus, X, Images,
} from "lucide-react"
import { createResort } from "@/services/resorts"
import { listCountries, type CountrySummary } from "@/services/countries"
import { listCities, type CitySummary } from "@/services/cities"
import hero from "@/assets/hero-resort.jpg"

const STEPS = ["Essence", "Location", "Contact"] as const
const DRAFT_KEY = "resort_create_dialog_draft"

type DraftState = {
  step: number
  name: string
  description: string
  address: string
  countryId: string
  cityId: string
  contactEmail: string
  contactPhone: string
}

interface ResortDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ResortDialog({ open, onOpenChange, onSuccess }: ResortDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [countryId, setCountryId] = useState("")
  const [cityId, setCityId] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [coverIndex, setCoverIndex] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [countries, setCountries] = useState<CountrySummary[]>([])
  const [allCities, setAllCities] = useState<CitySummary[]>([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
  const [draftFlash, setDraftFlash] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  // Revoke object URLs when images change to avoid memory leaks
  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f))
    setImageUrls(urls)
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)) }
  }, [images])

  // Load draft when dialog opens
  useEffect(() => {
    if (!open) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d: DraftState = JSON.parse(raw)
        setStep(d.step ?? 0)
        setName(d.name ?? "")
        setDescription(d.description ?? "")
        setAddress(d.address ?? "")
        setCountryId(d.countryId ?? "")
        setCityId(d.cityId ?? "")
        setContactEmail(d.contactEmail ?? "")
        setContactPhone(d.contactPhone ?? "")
        setDraftSavedAt(new Date())
      }
    } catch {}
    isFirstRender.current = true
  }, [open])

  // Auto-save draft on field changes (images are not saved to localStorage)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      const draft: DraftState = { step, name, description, address, countryId, cityId, contactEmail, contactPhone }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setDraftSavedAt(new Date())
      setDraftFlash(true)
      setTimeout(() => setDraftFlash(false), 1500)
    }, 400)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [step, name, description, address, countryId, cityId, contactEmail, contactPhone])

  useEffect(() => {
    listCountries({ size: 100, sort_by: "name", sort_dir: "ASC" })
      .then((res) => setCountries(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!countryId) { setAllCities([]); return }
    setCitiesLoading(true)
    listCities({ size: 200, sort_by: "name", sort_dir: "ASC" })
      .then((res) => setAllCities(res.data))
      .catch(() => setAllCities([]))
      .finally(() => setCitiesLoading(false))
  }, [countryId])

  const availableCities = useMemo(
    () => allCities.filter((c) => c.country_id === Number(countryId)),
    [allCities, countryId],
  )

  const countryName = countries.find((c) => String(c.id) === countryId)?.name
  const cityName = availableCities.find((c) => String(c.id) === cityId)?.name
  const previewLocation = [cityName, countryName].filter(Boolean).join(", ")

  const hasDraft = !!(name || description || address || countryId || contactEmail || contactPhone)

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setDraftSavedAt(null)
    isFirstRender.current = true
    setStep(0)
    setName("")
    setDescription("")
    setAddress("")
    setCountryId("")
    setCityId("")
    setContactEmail("")
    setContactPhone("")
    setImages([])
    setCoverIndex(0)
  }

  const reset = () => {
    localStorage.removeItem(DRAFT_KEY)
    setDraftSavedAt(null)
    setStep(0)
    setName("")
    setDescription("")
    setAddress("")
    setCountryId("")
    setCityId("")
    setContactEmail("")
    setContactPhone("")
    setImages([])
    setCoverIndex(0)
  }

  const MAX_IMAGES = 4

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (valid.length === 0) return
    setImages((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size))
      const merged = [...prev, ...valid.filter((f) => !existing.has(f.name + f.size))]
      if (merged.length > MAX_IMAGES) {
        toast.error(`You can upload up to ${MAX_IMAGES} images.`)
        return merged.slice(0, MAX_IMAGES)
      }
      return merged
    })
  }, [])

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index)
      setCoverIndex((c) => Math.min(c, Math.max(0, next.length - 1)))
      return next
    })
  }, [])

  const close = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)

  const canNext =
    (step === 0 && name.trim() && description.trim()) ||
    (step === 1 && address.trim() && countryId && cityId) ||
    (step === 2 && emailValid && contactPhone.trim())

  const handleSubmit = async () => {
    if (!canNext) return
    setSubmitting(true)
    try {
      const resort = await createResort({
        name: name.trim(),
        description: description.trim(),
        country_id: Number(countryId),
        ...(cityId ? { city_id: Number(cityId) } : {}),
        ...(address ? { address } : {}),
        ...(contactEmail ? { contact_email: contactEmail.trim() } : {}),
        ...(contactPhone ? { contact_phone: contactPhone.trim() } : {}),
      })
      localStorage.removeItem(DRAFT_KEY)
      toast.success("Resort created!")
      onSuccess()
      close(false)
      router.push(`/resorts/${resort.id}/dashboard`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  const selectClass =
    "flex h-12 w-full rounded-xl border border-border bg-muted/40 px-4 text-sm outline-none transition-all duration-200 hover:border-foreground/20 focus-visible:border-foreground/30 focus-visible:ring-4 focus-visible:ring-foreground/[0.06] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/[0.04]"

  const textareaClass =
    "flex w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/50 hover:border-foreground/20 focus-visible:border-foreground/30 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-foreground/[0.06] resize-none dark:bg-white/[0.04]"

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-card border-border/60 gap-0">
        <div className="grid md:grid-cols-[260px_1fr]">

          {/* Left rail — live preview */}
          <aside className="relative hidden md:block overflow-hidden">
            <img
              src={imageUrls[coverIndex] ?? hero.src}
              alt="Resort cover preview"
              className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-in-out"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/40 to-primary/90" />

            <div className="relative h-full flex flex-col justify-between p-6 text-primary-foreground">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">New destination</p>
              </div>

              <div className="space-y-3">
                <p className="text-xl font-semibold leading-tight line-clamp-2">
                  {name || "Resort name"}
                </p>

                {(description) && (
                  <p className="text-xs opacity-75 line-clamp-3 leading-relaxed">
                    {description}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-xs opacity-80">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">{previewLocation || "Location"}</span>
                </div>

                {(contactEmail || contactPhone) && (
                  <div className="flex flex-col gap-1">
                    {contactEmail && (
                      <div className="flex items-center gap-1.5 text-xs opacity-80">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">{contactEmail}</span>
                      </div>
                    )}
                    {contactPhone && (
                      <div className="flex items-center gap-1.5 text-xs opacity-80">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">{contactPhone}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-primary-foreground/20 flex items-center justify-between text-xs">
                  <span className="opacity-70">Step</span>
                  <span className="text-base font-semibold">
                    {step + 1}<span className="opacity-50">/{STEPS.length}</span>
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right — form */}
          <div className="flex flex-col min-h-[560px]">

            {/* Progress */}
            <div className="px-8 pt-7">
              <div className="flex items-center gap-2 mb-6">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 shrink-0",
                      i < step && "bg-primary text-primary-foreground",
                      i === step && "bg-primary text-primary-foreground scale-110",
                      i > step && "bg-muted text-muted-foreground",
                    )}>
                      {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={cn(
                        "h-px flex-1 transition-colors duration-500",
                        i < step ? "bg-primary" : "bg-border",
                      )} />
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{STEPS[step]}</p>

              <h2 className="text-3xl font-semibold mt-1">
                {step === 0 && "Name your sanctuary"}
                {step === 1 && "Where to find it"}
                {step === 2 && "How guests reach you"}
              </h2>
            </div>

            {/* Body */}
            <div className="px-8 py-6 flex-1 overflow-y-auto">

              {step === 0 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Resort name</Label>
                    <Input
                      id="name" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Lagoon Serenity" maxLength={80} autoFocus
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description" className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                        Description
                      </Label>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {description.length} / 280
                      </span>
                    </div>
                    
                    <textarea
                      id="description" value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Overwater bungalows perched above a turquoise lagoon…"
                      maxLength={280} rows={4} className={textareaClass}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Images className="h-3.5 w-3.5 text-muted-foreground" />
                      Photos
                    </Label>

                    {/* Upload zone — only shown when no images yet */}
                    {images.length === 0 && (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Upload images"
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDragOver(false)
                        addFiles(e.dataTransfer.files)
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-colors duration-200",
                        dragOver
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-foreground/30 hover:bg-muted/40",
                      )}
                    >
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground text-center">
                        <span className="font-medium text-foreground">Click to upload</span>{" "}
                        or drag &amp; drop
                      </p>
                      <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP · up to {MAX_IMAGES} photos</p>
                    </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => addFiles(e.target.files)}
                    />

                    {/* Thumbnails */}
                    {imageUrls.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {imageUrls.map((url, i) => (
                          <div
                            key={url}
                            role="button"
                            tabIndex={0}
                            aria-label={`Select as cover${i === coverIndex ? " (current cover)" : ""}`}
                            onClick={() => setCoverIndex(i)}
                            onKeyDown={(e) => e.key === "Enter" && setCoverIndex(i)}
                            className={cn(
                              "group relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
                              i === coverIndex
                                ? "ring-2 ring-primary ring-offset-2"
                                : "ring-1 ring-border hover:ring-foreground/30",
                            )}
                          >
                            <img
                              src={url}
                              alt={images[i]?.name}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                            {i === coverIndex && (
                              <div className="absolute bottom-0 inset-x-0 bg-primary/80 text-primary-foreground text-[9px] uppercase tracking-[0.2em] text-center py-0.5">
                                Cover
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                              aria-label="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {/* Add more button */}
                        {images.length < MAX_IMAGES && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-foreground/30 hover:bg-muted/40 flex items-center justify-center transition-colors"
                            aria-label="Add more images"
                          >
                            <ImagePlus className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country" className="flex items-center gap-2">
                        <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
                        Country
                      </Label>
                      <select
                        id="country" value={countryId}
                        onChange={(e) => { setCountryId(e.target.value); setCityId("") }}
                        className={selectClass}
                      >
                        <option value="">Select country</option>
                        {countries.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        City
                      </Label>
                      <select
                        id="city" value={cityId}
                        onChange={(e) => setCityId(e.target.value)}
                        disabled={!countryId || citiesLoading}
                        className={selectClass}
                      >
                        <option value="">
                          {!countryId ? "Pick country first" : citiesLoading ? "Loading…" : "Select city"}
                        </option>
                        {availableCities.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      Street address
                    </Label>
                    <Input
                      id="address" value={address} onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Lagoon Road, Beachfront" maxLength={160} className="h-12"
                    />
                  </div>

                  {previewLocation && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50 flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">{previewLocation}</p>
                        {address && (
                          <p className="text-muted-foreground text-xs mt-0.5">{address}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Contact email
                    </Label>
                    <Input
                      id="email" type="email" value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="concierge@yourresort.com" className="h-12"
                    />
                    {contactEmail && !emailValid && (
                      <p className="text-xs text-destructive">Please enter a valid email</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Contact phone
                    </Label>
                    <Input
                      id="phone" type="tel" value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1 555 123 4567" className="h-12"
                    />
                  </div>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-border/60 flex items-center justify-between gap-4 bg-background/50">
              <Button
                type="button" variant="ghost"
                onClick={() => step === 0 ? close(false) : setStep(step - 1)}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {step === 0 ? "Cancel" : "Back"}
              </Button>

              {/* Draft indicator */}
              {hasDraft && draftSavedAt && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-500 shrink-0",
                    draftFlash
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-600",
                  )}>
                    {draftFlash
                      ? <><CheckCircle2 className="size-3" /> Saved</>
                      : <><CircleDashed className="size-3 animate-spin [animation-duration:3s]" />
                          Draft · {draftSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </>
                    }
                  </div>
                  <button
                    type="button"
                    onClick={discardDraft}
                    className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="size-3" />
                    Discard
                  </button>
                </div>
              )}

              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => canNext && setStep(step + 1)}
                  disabled={!canNext}
                  className="min-w-[120px] shrink-0"
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canNext || submitting}
                  className="min-w-[140px] shrink-0"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {submitting ? "Creating…" : "Add resort"}
                </Button>
              )}
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
