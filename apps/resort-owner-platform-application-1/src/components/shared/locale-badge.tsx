import { Badge } from "@resort/shadcn-ui"
import type { Locale } from "@/services/locales"

export function LocaleBadge({ locale }: { locale: Locale }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-mono uppercase">
      {locale.code}
      <span className="font-sans normal-case text-muted-foreground">{locale.name}</span>
    </Badge>
  )
}
