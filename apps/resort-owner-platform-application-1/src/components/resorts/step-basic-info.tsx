"use client"

import { Globe2 } from "lucide-react"
import { Input, Textarea } from "@resort/shadcn-ui"
import { useTranslation } from "react-i18next"
import { StepHeader, FieldRow } from "./step-dialog"
import type { StepOneForm } from "./create-resort-dialog"

export interface StepBasicInfoProps {
  form: StepOneForm
  codeUserEdited: boolean
  submitting: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function StepBasicInfo({ form, codeUserEdited, submitting, onChange }: StepBasicInfoProps) {
  const { t } = useTranslation()

  return (
    <>
      <StepHeader
        eyebrow={t("resort.step1Label")}
        title={t("resort.basicInfo")}
        badge={{ icon: <Globe2 className="h-3 w-3" />, label: t("resort.enDefault") }}
      />

      <FieldRow label={t("resort.nameLabel")} htmlFor="name">
        <Input
          id="name"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder={t("resort.namePlaceholder")}
          maxLength={200}
          disabled={submitting}
          autoFocus
        />
      </FieldRow>

      <FieldRow label={t("resort.taglineLabel")} htmlFor="tagline">
        <Input
          id="tagline"
          name="tagline"
          value={form.tagline}
          onChange={onChange}
          placeholder={t("resort.taglinePlaceholder")}
          maxLength={255}
          disabled={submitting}
        />
      </FieldRow>

      <FieldRow
        label={t("resort.shortDescLabel")}
        htmlFor="short_description"
        labelExtra={<span className="text-xs text-muted-foreground">{t("resort.optional")}</span>}
        hint={t("resort.enOnlyHint")}
      >
        <Textarea
          id="short_description"
          name="short_description"
          value={form.short_description}
          onChange={onChange}
          placeholder={t("resort.shortDescPlaceholder")}
          maxLength={1024}
          rows={2}
          disabled={submitting}
        />
      </FieldRow>

      <FieldRow
        label={t("resort.code")}
        htmlFor="code"
        labelExtra={
          !codeUserEdited && form.code ? (
            <span className="text-[10px] text-muted-foreground">{t("resort.autoFilledHint")}</span>
          ) : undefined
        }
        hint={t("resort.codeHint")}
      >
        <Input
          id="code"
          name="code"
          value={form.code}
          onChange={onChange}
          placeholder="e.g. SUNSET-RESORT"
          maxLength={50}
          disabled={submitting}
        />
      </FieldRow>

      <FieldRow label={t("resort.estd")} htmlFor="estd">
        <Input
          id="estd"
          name="estd"
          type="number"
          value={form.estd}
          onChange={onChange}
          placeholder="e.g. 1998"
          min={1800}
          max={new Date().getFullYear()}
          disabled={submitting}
        />
      </FieldRow>
    </>
  )
}
