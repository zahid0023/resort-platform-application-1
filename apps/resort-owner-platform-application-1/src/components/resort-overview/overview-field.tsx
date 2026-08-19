import { TypographyLabel } from "@/components/shared/typography"

interface OverviewFieldProps {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}

export function OverviewField({ icon, label, children }: OverviewFieldProps) {
  return (
    <div className="rounded-lg border p-3">
      <TypographyLabel className="flex items-center gap-2">
        {icon}
        {label}
      </TypographyLabel>
      <p className="mt-1 text-lg font-semibold tracking-tight">{children}</p>
    </div>
  )
}
