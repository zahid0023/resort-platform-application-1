import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-border bg-muted/40 px-4 py-2 text-sm transition-all duration-200 outline-none placeholder:text-muted-foreground/50 hover:border-foreground/20 hover:bg-muted/60 focus-visible:border-foreground/30 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-foreground/[0.06] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive/60 aria-invalid:ring-4 aria-invalid:ring-destructive/10 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground dark:bg-white/[0.04] dark:hover:bg-white/[0.07] dark:focus-visible:bg-white/[0.03] dark:focus-visible:ring-white/[0.06]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
