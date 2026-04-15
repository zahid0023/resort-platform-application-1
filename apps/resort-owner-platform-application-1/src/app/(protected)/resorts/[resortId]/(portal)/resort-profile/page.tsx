"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { PencilIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  ResortForm, loadDraft, clearDraft,
  type ResortFormState,
} from "@/components/resorts/resort-form"
import {
  getResort, updateResort,
  type Resort, type UpdateResortRequest,
} from "@/services/resorts"
import { listCountries, type CountrySummary } from "@/services/countries"
import { listCities, type CitySummary } from "@/services/cities"

function resortToForm(r: Resort): ResortFormState {
  return {
    name: r.name,
    description: r.description,
    address: r.address ?? "",
    country_id: String(r.country_id),
    city_id: r.city_id ? String(r.city_id) : "",
    contact_email: r.contact_email ?? "",
    contact_phone: r.contact_phone ?? "",
  }
}

export default function ResortProfilePage() {
  const params = useParams()
  const resortId = Number(params.resortId)
  const editDraftKey = `resort_edit_draft_${resortId}`

  const [resort, setResort] = useState<Resort | null>(null)
  const [form, setForm] = useState<ResortFormState | null>(null)
  const [countries, setCountries] = useState<CountrySummary[]>([])
  const [allCities, setAllCities] = useState<CitySummary[]>([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    Promise.all([
      getResort(resortId),
      listCountries({ size: 100, sort_by: "name", sort_dir: "ASC" }),
    ])
      .then(([r, c]) => {
        setResort(r.data)
        setForm(resortToForm(r.data))
        setCountries(c.data)
      })
      .catch(() => toast.error("Failed to load resort."))
      .finally(() => setLoading(false))
  }, [resortId])

  useEffect(() => {
    if (!form?.country_id) { setAllCities([]); return }
    setCitiesLoading(true)
    listCities({ size: 200, sort_by: "name", sort_dir: "ASC" })
      .then((res) => setAllCities(res.data))
      .catch(() => setAllCities([]))
      .finally(() => setCitiesLoading(false))
  }, [form?.country_id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => prev ? ({
      ...prev,
      [name]: value,
      ...(name === "country_id" ? { city_id: "" } : {}),
    }) : prev)
  }

  const isDirty = form && resort
    ? JSON.stringify(form) !== JSON.stringify(resortToForm(resort))
    : false

  const handleEdit = () => {
    const draft = loadDraft(editDraftKey)
    if (draft) setForm((prev) => prev ? { ...prev, ...draft } : prev)
    setIsEditing(true)
  }

  const handleCancel = () => {
    clearDraft(editDraftKey)
    if (resort) setForm(resortToForm(resort))
    setIsEditing(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    try {
      const payload: UpdateResortRequest = {
        name: form.name,
        description: form.description,
        country_id: Number(form.country_id),
        ...(form.city_id ? { city_id: Number(form.city_id) } : {}),
        ...(form.address ? { address: form.address } : {}),
        ...(form.contact_email ? { contact_email: form.contact_email } : {}),
        ...(form.contact_phone ? { contact_phone: form.contact_phone } : {}),
      }
      const updated = await updateResort(resortId, payload)
      clearDraft(editDraftKey)
      setResort(updated)
      setForm(resortToForm(updated))
      setIsEditing(false)
      toast.success("Resort updated successfully!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
  }
  if (!form) {
    return <div className="flex justify-center py-20 text-sm text-muted-foreground">Resort not found.</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Resort Profile</h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Edit your resort details below." : "View your resort details."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Button variant="outline" size="sm" disabled={saving} onClick={handleCancel}>
              <XIcon className="size-3.5" />
              Cancel
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <PencilIcon className="size-3.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <ResortForm
        form={form}
        countries={countries}
        allCities={allCities}
        citiesLoading={citiesLoading}
        onChange={handleChange}
        onSubmit={handleSave}
        onDiscard={handleCancel}
        isDirty={isEditing && !!isDirty}
        submitting={saving}
        submitLabel="Save Changes"
        discardLabel="Discard Draft"
        mode={isEditing ? "edit" : "view"}
        draftKey={isEditing ? editDraftKey : undefined}
      />
    </div>
  )
}
