"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react"
import { Button } from "@resort/shadcn-ui"
import { Spinner } from "@resort/shadcn-ui"
import { ResortCard } from "@/components/resorts/resort-card"
import { CreateResortDialog } from "@/components/resorts/create-resort-dialog"
import { LogoutButton } from "@/components/auth/logout-button"
import { LocaleToggle } from "@/components/locale-toggle"
import { Container } from "@/components/shared/container"
import { Display, Text, TypographyLabel } from "@/components/shared/typography"
import { listResorts, type ResortSummary, type ResortListResponse } from "@/services/resorts"
import { useTranslation } from "react-i18next"

export default function ResortsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [data, setData] = useState<ResortListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      setData(await listResorts({ page, size: 12, sort_by: "id", sort_dir: "ASC" }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("resorts.errLoad"))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchList() }, [fetchList])

  const handleOpen = (resort: ResortSummary) => {
    router.push(`/resorts/${resort.id}/dashboard`)
  }

  const total = data?.total_elements ?? 0

  return (
    <div className="min-h-screen">

      {/* ── Sticky header ── */}
      <header className="border-b border-border bg-background/60 backdrop-blur-md sticky top-0 z-30">
        <Container className="flex items-center justify-between py-4 sm:py-5">

          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Resort Platform
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <LocaleToggle />
            <LogoutButton className="text-muted-foreground hover:text-foreground" />
          </div>

        </Container>
      </header>

      {/* ── Content ── */}
      <main>
        <Container className="pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24">

          {/* Header section */}
          <section className="mb-8 sm:mb-10 lg:mb-12">
            <TypographyLabel className="mb-4 tracking-[0.3em]">
              {t("resorts.portfolio")}
            </TypographyLabel>
            <Display size="xl" className="max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
              {t("resorts.headline1")}{" "}
              <em className="font-normal italic text-muted-foreground">{t("resorts.headline2")}</em>{" "}
              {t("resorts.headline3")}
            </Display>
            {!loading && (
              <Text size="md" className="mt-5">
                {t("resorts.destinations", { count: total })}
              </Text>
            )}
          </section>

          {/* Content section */}
          <section>
            {loading ? (
              <div className="flex justify-center py-32">
                <Spinner className="size-6" />
                <span className="sr-only">{t("resorts.loading")}</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">

                {data?.data.map((resort, i) => (
                  <ResortCard key={resort.id} data={resort} index={i} onOpen={handleOpen} />
                ))}

                {/* Create new resort card */}
                <button
                  onClick={() => setDialogOpen(true)}
                  className="group relative aspect-4/5 w-full overflow-hidden rounded-2xl border-2 border-dashed border-border bg-card/40 transition-all duration-500 hover:border-foreground/30 hover:bg-card hover:shadow-lg hover:cursor-pointer"
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center lg:gap-5 lg:p-10">
                    <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-all duration-500 group-hover:border-foreground/20 group-hover:bg-foreground/5 group-hover:text-foreground group-hover:scale-110 lg:size-16">
                      <PlusIcon className="size-6 lg:size-7" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-foreground lg:text-lg">{t("resorts.addNew")}</h3>
                      <p className="mt-1 text-xs text-muted-foreground lg:text-sm">
                        {t("resorts.addNewDesc")}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Pagination */}
            {data && data.total_pages > 1 && (
              <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  Page {data.current_page + 1} of {data.total_pages} — {data.total_elements} total
                </span>
                <div className="flex gap-2">
                  <Button
                    size="icon-lg"
                    variant="outline"
                    className="min-h-10 min-w-10"
                    disabled={!data.has_previous}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeftIcon />
                  </Button>
                  <Button
                    size="icon-lg"
                    variant="outline"
                    className="min-h-10 min-w-10"
                    disabled={!data.has_next}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRightIcon />
                  </Button>
                </div>
              </div>
            )}
          </section>

        </Container>
      </main>

      <CreateResortDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchList}
      />
    </div>
  )
}
