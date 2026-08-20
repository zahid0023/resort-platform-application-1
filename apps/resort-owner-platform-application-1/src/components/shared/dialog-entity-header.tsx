import type { ReactNode } from "react"
import { DialogDescription, DialogHeader, DialogTitle } from "@resort/shadcn-ui"

interface DialogEntityHeaderProps {
  icon: ReactNode
  title: string
  description: string
  /** Optional right-aligned slot, e.g. a Save button for a tab whose action needs to stay
   * reachable regardless of scroll position — this header is a fixed flex child above the
   * scrollable tab content, so anything placed here stays visible without scrolling. */
  actions?: ReactNode
}

export function DialogEntityHeader({ icon, title, description, actions }: DialogEntityHeaderProps) {
  return (
    <DialogHeader className="shrink-0 px-6 py-5 border-b bg-muted/40">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold leading-tight">{title}</DialogTitle>
            <DialogDescription className="text-xs mt-0.5">{description}</DialogDescription>
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </DialogHeader>
  )
}
