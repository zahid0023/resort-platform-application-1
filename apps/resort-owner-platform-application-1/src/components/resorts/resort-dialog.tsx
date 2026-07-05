"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@resort/shadcn-ui"
import { Button } from "@resort/shadcn-ui"
import { Input } from "@resort/shadcn-ui"
import { Label } from "@resort/shadcn-ui"
import { Loader2, Sparkles, ChevronLeft } from "lucide-react"
import { createResort } from "@/services/resorts"
import hero from "@/assets/hero-resort.jpg"

interface ResortDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ResortDialog({ open, onOpenChange, onSuccess }: ResortDialogProps) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setCode("")
      setSubmitting(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const canSubmit = !!code.trim() && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const result = await createResort(code.trim())
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
            <img
              src={hero.src}
              alt="Resort"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/40 to-primary/90" />
            <div className="relative h-full flex flex-col justify-between p-6 text-primary-foreground">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">New destination</p>
              </div>
              <div className="space-y-3">
                <p className="text-xl font-semibold leading-tight line-clamp-2">
                  {code || "Resort code"}
                </p>
              </div>
            </div>
          </aside>

          {/* Right — form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-8 pt-7 pb-6 flex-1 overflow-y-auto">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">New resort</p>
              <h2 className="text-3xl font-semibold mt-1 mb-6">Name your sanctuary</h2>

              <div className="space-y-2">
                <Label htmlFor="code">Resort code</Label>
                <Input
                  ref={inputRef}
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SUNSET-RESORT"
                  maxLength={100}
                  className="h-12 text-base"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  A short, unique identifier for this resort. Cannot be changed after creation.
                </p>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-border/60 flex items-center justify-between gap-4 bg-background/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={!canSubmit}
                className="min-w-[140px] shrink-0"
              >
                {submitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><Sparkles className="h-4 w-4 mr-1" /> Add resort</>
                }
              </Button>
            </div>
          </form>

        </div>
      </DialogContent>
    </Dialog>
  )
}
