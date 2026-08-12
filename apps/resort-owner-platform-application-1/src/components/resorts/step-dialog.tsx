"use client"

import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Sparkles, ArrowRight } from "lucide-react"
import { Button, Label, cn } from "@resort/shadcn-ui"

// Eyebrow + title, followed by either a one-line subtitle (intro screen) or a small pill badge
// (step screens) — the two step-header shapes used throughout the create-resort wizard.
export interface StepHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
  badge?: { icon: React.ReactNode; label: string }
}

export function StepHeader({ eyebrow, title, subtitle, badge }: StepHeaderProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
      <h2 className="text-xl sm:text-2xl font-semibold mt-1">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      {badge && (
        <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
          {badge.icon}
          {badge.label}
        </span>
      )}
    </div>
  )
}

// Icon circle + title/description row used for the intro screen's feature bullets.
export interface IntroBulletProps {
  icon: React.ReactNode
  title: string
  desc: string
}

export function IntroBullet({ icon, title, desc }: IntroBulletProps) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

// Label row (with an optional right-aligned badge/hint slot) wrapping an arbitrary form control,
// plus an optional helper line underneath. `compact` shrinks it to the size used inside the
// contact-row cards in step 3.
export interface FieldRowProps {
  label: string
  htmlFor?: string
  labelExtra?: React.ReactNode
  hint?: string
  compact?: boolean
  children: React.ReactNode
}

export function FieldRow({ label, htmlFor, labelExtra, hint, compact, children }: FieldRowProps) {
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor} className={compact ? "text-xs text-muted-foreground" : undefined}>
          {label}
        </Label>
        {labelExtra}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// Button styled to look like a select trigger, opening a picker dialog (country/city/contact
// type/channel) instead of a native dropdown. `compact` matches the smaller size used inside the
// contact-row cards in step 3.
export interface PickerFieldProps {
  label: string
  value: string
  placeholder: string
  onClick: () => void
  disabled?: boolean
  compact?: boolean
}

export function PickerField({ label, value, placeholder, onClick, disabled, compact }: PickerFieldProps) {
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <Label className={compact ? "text-xs text-muted-foreground" : undefined}>{label}</Label>
      <Button
        type="button"
        variant="outline"
        className={cn("w-full justify-between font-normal", compact && "h-8 text-xs")}
        onClick={onClick}
        disabled={disabled}
      >
        <span className={value ? "" : "text-muted-foreground"}>{value || placeholder}</span>
        <ChevronDown className={cn("opacity-50 shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
      </Button>
    </div>
  )
}

// The bottom nav bar shared by the intro screen and every wizard step: a left (cancel/back) slot
// and a right (next/submit) slot inside the same padded, bordered strip.
export interface DialogFooterBarProps {
  left: React.ReactNode
  right: React.ReactNode
}

export function DialogFooterBar({ left, right }: DialogFooterBarProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-t border-border/60 flex items-center justify-between gap-3 sm:gap-4 bg-background/50">
      {left}
      {right}
    </div>
  )
}

// The ghost, leading-chevron button that fills the footer's left slot — "Cancel" on the intro
// screen and step 1, "Back" on steps 2-3.
export interface FooterBackButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function FooterBackButton({ label, onClick, disabled }: FooterBackButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className="min-h-10 text-muted-foreground hover:text-foreground shrink-0"
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      {label}
    </Button>
  )
}

// The solid button that fills the footer's right slot — "Get Started", "Next", or "Submit"
// (which swaps its icon for a spinner while `loading`). `wide` matches the intro screen's wider
// minimum width; steps 1-3 use the narrower default.
export interface FooterPrimaryButtonProps {
  label: string
  type?: "button" | "submit"
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  wide?: boolean
}

export function FooterPrimaryButton({
  label,
  type = "button",
  onClick,
  disabled,
  loading,
  leadingIcon,
  trailingIcon,
  wide,
}: FooterPrimaryButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("min-h-10 shrink-0", wide ? "min-w-[140px] sm:min-w-[180px]" : "min-w-[110px] sm:min-w-[140px]")}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {leadingIcon}
          {label}
          {trailingIcon}
        </>
      )}
    </Button>
  )
}

// The intro screen's footer: "Cancel" on the left, "Get Started" (wide, trailing arrow) on the
// right.
export interface IntroFooterProps {
  cancelLabel: string
  nextLabel: string
  onCancel: () => void
  onNext: () => void
}

export function IntroFooter({ cancelLabel, nextLabel, onCancel, onNext }: IntroFooterProps) {
  return (
    <DialogFooterBar
      left={<FooterBackButton label={cancelLabel} onClick={onCancel} />}
      right={
        <FooterPrimaryButton
          label={nextLabel}
          onClick={onNext}
          trailingIcon={<ArrowRight className="h-4 w-4 ml-1" />}
          wide
        />
      }
    />
  )
}

// The wizard steps' footer: "Cancel"/"Back" on the left (Cancel only on the first step), and
// "Next"/"Submit" on the right depending on `isLastStep` (Submit shows a spinner while
// `submitting`).
export interface WizardFooterProps {
  isFirstStep: boolean
  isLastStep: boolean
  backLabel: string
  cancelLabel: string
  nextLabel: string
  submitLabel: string
  onBack: () => void
  onCancel: () => void
  nextDisabled: boolean
  submitDisabled: boolean
  submitting: boolean
}

export function WizardFooter({
  isFirstStep,
  isLastStep,
  backLabel,
  cancelLabel,
  nextLabel,
  submitLabel,
  onBack,
  onCancel,
  nextDisabled,
  submitDisabled,
  submitting,
}: WizardFooterProps) {
  return (
    <DialogFooterBar
      left={
        <FooterBackButton
          label={isFirstStep ? cancelLabel : backLabel}
          onClick={isFirstStep ? onCancel : onBack}
          disabled={submitting}
        />
      }
      right={
        !isLastStep ? (
          <FooterPrimaryButton
            type="submit"
            label={nextLabel}
            disabled={nextDisabled}
            trailingIcon={<ChevronRight className="h-4 w-4 ml-1" />}
          />
        ) : (
          <FooterPrimaryButton
            type="submit"
            label={submitLabel}
            disabled={submitDisabled}
            loading={submitting}
            leadingIcon={<Sparkles className="h-4 w-4 mr-1" />}
          />
        )
      }
    />
  )
}
