import { cn } from "@resort/shadcn-ui"

// Marketing-scale headline, e.g. the /resorts landing headline. Font size grows across
// breakpoints; a shorter line-height keeps multi-line headlines tight.
type DisplaySize = "xl" | "lg" | "md"

const displaySizeClasses: Record<DisplaySize, string> = {
  xl: "text-4xl sm:text-5xl lg:text-6xl",
  lg: "text-3xl sm:text-4xl lg:text-5xl",
  md: "text-2xl sm:text-3xl lg:text-4xl",
}

export interface DisplayProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: DisplaySize
}

export function Display({ size = "lg", className, ...props }: DisplayProps) {
  return (
    <h1
      className={cn(displaySizeClasses[size], "font-semibold leading-[1.1] tracking-tight text-foreground", className)}
      {...props}
    />
  )
}

// Section/page headings. H1-H2 scale up on larger screens; H3-H4 stay closer to their mobile
// size since they're already reads as "small enough" at 18-16px.
type HeadingLevel = 1 | 2 | 3 | 4

const headingSizeClasses: Record<HeadingLevel, string> = {
  1: "text-2xl sm:text-3xl lg:text-4xl",
  2: "text-xl sm:text-2xl lg:text-3xl",
  3: "text-lg lg:text-xl",
  4: "text-base sm:text-lg",
}

const headingTags: Record<HeadingLevel, "h1" | "h2" | "h3" | "h4"> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
}

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel
}

export function Heading({ level = 1, className, ...props }: HeadingProps) {
  const Tag = headingTags[level]
  return (
    <Tag
      className={cn(headingSizeClasses[level], "font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  )
}

// Body copy. Deliberately NOT responsive — readable paragraph text should stay a stable size
// across breakpoints rather than growing on desktop.
type BodySize = "lg" | "md" | "sm" | "xs"

const bodySizeClasses: Record<BodySize, string> = {
  lg: "text-base",
  md: "text-sm",
  sm: "text-xs",
  xs: "text-[11px]",
}

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: BodySize
}

export function Text({ size = "md", className, ...props }: TextProps) {
  return <p className={cn(bodySizeClasses[size], "leading-relaxed text-foreground", className)} {...props} />
}

// Small uppercase caption/eyebrow text, e.g. section tags or field labels above a value.
export function TypographyLabel({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("text-xs font-medium uppercase tracking-wider text-muted-foreground", className)}
      {...props}
    />
  )
}
