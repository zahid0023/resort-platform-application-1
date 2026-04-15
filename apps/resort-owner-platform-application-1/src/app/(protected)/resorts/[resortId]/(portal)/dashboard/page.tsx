"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { BuildingIcon, MapPinIcon, MailIcon, PhoneIcon, GlobeIcon } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { getResort, type Resort } from "@/services/resorts"

function InfoRow({ icon, label, value }: {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  )
}

export default function ResortDashboardPage() {
  const params = useParams()
  const resortId = Number(params.resortId)

  const [resort, setResort] = useState<Resort | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getResort(resortId)
      .then((res) => setResort(res.data))
      .catch(() => toast.error("Failed to load resort."))
      .finally(() => setLoading(false))
  }, [resortId])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!resort) {
    return (
      <div className="flex justify-center py-20 text-sm text-muted-foreground">
        Resort not found.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Resort hero */}
      <div className="flex items-start gap-4 rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BuildingIcon className="size-7" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{resort.name}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {resort.description}
          </p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Location */}
        <div className="rounded-xl border bg-card p-5 shadow-xs flex flex-col gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Location
          </span>
          <InfoRow
            icon={<MapPinIcon className="size-3.5" />}
            label="Address"
            value={resort.address}
          />
          <InfoRow
            icon={<GlobeIcon className="size-3.5" />}
            label="Country ID"
            value={String(resort.country_id)}
          />
          {resort.city_id && (
            <InfoRow
              icon={<GlobeIcon className="size-3.5" />}
              label="City ID"
              value={String(resort.city_id)}
            />
          )}
        </div>

        {/* Contact */}
        <div className="rounded-xl border bg-card p-5 shadow-xs flex flex-col gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contact
          </span>
          <InfoRow
            icon={<MailIcon className="size-3.5" />}
            label="Email"
            value={resort.contact_email}
          />
          <InfoRow
            icon={<PhoneIcon className="size-3.5" />}
            label="Phone"
            value={resort.contact_phone}
          />
        </div>
      </div>
    </div>
  )
}
