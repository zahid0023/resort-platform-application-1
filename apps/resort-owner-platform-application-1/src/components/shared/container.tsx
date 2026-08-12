import { cn } from "@resort/shadcn-ui"

export interface ContainerProps {
  children: React.ReactNode
  className?: string
}

// Caps content width so it stays readable on ultra-wide monitors instead of stretching
// edge-to-edge; padding grows with the viewport (16px mobile -> 48px 2xl) per the app's
// responsive spacing scale.
export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12", className)}>
      {children}
    </div>
  )
}
