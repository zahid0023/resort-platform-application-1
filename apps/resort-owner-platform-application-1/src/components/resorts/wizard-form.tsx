"use client"

import { WizardFooter, type WizardFooterProps } from "./step-dialog"
import { StepBasicInfo, type StepBasicInfoProps } from "./step-basic-info"
import { StepLocation, type StepLocationProps } from "./step-location"
import { StepContact, type StepContactProps } from "./step-contact"

export interface WizardFormProps {
  step: number
  totalSteps: number
  onSubmit: (e: React.FormEvent) => void
  basicInfoProps: StepBasicInfoProps
  locationProps: StepLocationProps
  contactProps: StepContactProps
  footerProps: Omit<WizardFooterProps, "isFirstStep" | "isLastStep">
}

export function WizardForm({
  step,
  totalSteps,
  onSubmit,
  basicInfoProps,
  locationProps,
  contactProps,
  footerProps,
}: WizardFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-7 pb-6 flex-1 overflow-y-auto space-y-5">

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i + 1 <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1 shrink-0">{step} / {totalSteps}</span>
        </div>

        {step === 1 && <StepBasicInfo {...basicInfoProps} />}
        {step === 2 && <StepLocation {...locationProps} />}
        {step === 3 && <StepContact {...contactProps} />}

      </div>

      <WizardFooter {...footerProps} isFirstStep={step === 1} isLastStep={step === totalSteps} />
    </form>
  )
}
