"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeftIcon, LogOutIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ResortForm, emptyResortForm, loadDraft, clearDraft,
  type ResortFormState,
} from "@/components/resorts/resort-form"
import { createResort } from "@/services/resorts"
import { logout } from "@/services/auth"
import { listCountries, type CountrySummary } from "@/services/countries"
import { listCities, type CitySummary } from "@/services/cities"

const DRAFT_KEY = "resort_create_draft"

export default function CreateNewResortPage() {
  const router = useRouter()
  const [form, setForm] = useState<ResortFormState>(emptyResortForm)
  const [countries, setCountries] = useState<CountrySummary[]>([])
  const [allCities, setAllCities] = useState<CitySummary[]>([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const draft = loadDraft(DRAFT_KEY)
    if (draft) setForm((prev) => ({ ...prev, ...draft }))
    listCountries({ size: 100, sort_by: "name", sort_dir: "ASC" })
      .then((res) => setCountries(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.country_id) { setAllCities([]); return }
    setCitiesLoading(true)
    listCities({ size: 200, sort_by: "name", sort_dir: "ASC" })
      .then((res) => setAllCities(res.data))
      .catch(() => setAllCities([]))
      .finally(() => setCitiesLoading(false))
  }, [form.country_id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "country_id" ? { city_id: "" } : {}),
    }))
  }

  const handleDiscard = () => {
    clearDraft(DRAFT_KEY)
    setForm(emptyResortForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const resort = await createResort({
        name: form.name,
        description: form.description,
        country_id: Number(form.country_id),
        ...(form.city_id ? { city_id: Number(form.city_id) } : {}),
        ...(form.address ? { address: form.address } : {}),
        ...(form.contact_email ? { contact_email: form.contact_email } : {}),
        ...(form.contact_phone ? { contact_phone: form.contact_phone } : {}),
      })
      clearDraft(DRAFT_KEY)
      toast.success("Resort created successfully!")
      router.push(`/resorts/${resort.id}/dashboard`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  const hasDraft = Object.values(form).some((v) => v !== "")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/resorts")}>
            <ArrowLeftIcon />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">New Resort</h1>
            <p className="text-sm text-muted-foreground">Fill in the details below to create your resort.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); router.push("/login") }}>
          <LogOutIcon />
          Log out
        </Button>
      </div>

      <ResortForm
        form={form}
        countries={countries}
        allCities={allCities}
        citiesLoading={citiesLoading}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onDiscard={handleDiscard}
        isDirty={hasDraft}
        submitting={submitting}
        submitLabel="Create Resort"
        discardLabel="Discard Draft"
        mode="create"
        draftKey={DRAFT_KEY}
      />
    </div>
  )
}
