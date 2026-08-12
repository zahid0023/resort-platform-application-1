"use client"

import { Globe2, Languages, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StepHeader, IntroBullet, IntroFooter } from "./step-dialog"

export interface WelcomeStepProps {
  onCancel: () => void
  onNext: () => void
}

export function WelcomeStep({ onCancel, onNext }: WelcomeStepProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-7 pb-6 flex-1 overflow-y-auto space-y-6">
        <StepHeader
          eyebrow={t("resort.gettingStarted")}
          title={t("resort.introTitle")}
          subtitle={t("resort.introSubtitle")}
        />

        <div className="space-y-4">
          <IntroBullet
            icon={<Globe2 className="h-4 w-4" />}
            title={t("resort.introBullet1Title")}
            desc={t("resort.introBullet1Desc")}
          />
          <IntroBullet
            icon={<Languages className="h-4 w-4" />}
            title={t("resort.introBullet2Title")}
            desc={t("resort.introBullet2Desc")}
          />
          <IntroBullet
            icon={<Lock className="h-4 w-4" />}
            title={t("resort.introBullet3Title")}
            desc={t("resort.introBullet3Desc")}
          />
        </div>
      </div>

      <IntroFooter
        cancelLabel={t("resort.cancel")}
        nextLabel={t("resort.introAction")}
        onCancel={onCancel}
        onNext={onNext}
      />
    </div>
  )
}
