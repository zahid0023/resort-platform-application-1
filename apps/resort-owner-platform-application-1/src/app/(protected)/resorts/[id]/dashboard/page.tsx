"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { BuildingIcon, PhoneIcon, ImageIcon, SettingsIcon } from "lucide-react"
import { Spinner } from "@resort/shadcn-ui"
import { getResort, type ResortSummary } from "@/services/resorts"
import { useTranslation } from "react-i18next"

const NAV_ITEMS = [
  {
    key: "basicInfo",
    href: (id: string) => `/resorts/${id}/basic-info`,
    icon: BuildingIcon,
  },
  {
    key: "contacts",
    href: (id: string) => `/resorts/${id}/contacts`,
    icon: PhoneIcon,
  },
  {
    key: "imageStorage",
    href: (id: string) => `/resorts/${id}/image-storage`,
    icon: ImageIcon,
  },
  {
    key: "settings",
    href: (id: string) => `/resorts/${id}/settings`,
    icon: SettingsIcon,
  },
]

export default function ResortDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const id = String(params.id)

  const [resort, setResort] = useState<ResortSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getResort(Number(id))
      .then((res) => setResort(res.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : t("resortDashboard.errLoad")))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="max-w-4xl mx-auto">
      {loading ? (
        <div className="flex justify-center py-32">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          <section className="mb-12">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t("resortDashboard.portal")}
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl">
              {t("resortDashboard.headline1")}{" "}
              <em className="font-normal italic text-muted-foreground">
                {resort?.code}
              </em>
            </h1>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NAV_ITEMS.map(({ key, href, icon: Icon }) => (
              <button
                key={key}
                onClick={() => router.push(href(id))}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-left transition-all duration-300 hover:border-foreground/20 hover:shadow-md hover:cursor-pointer"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {t(`resortDashboard.nav.${key}.title`)}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t(`resortDashboard.nav.${key}.desc`)}
                  </p>
                </div>
              </button>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
