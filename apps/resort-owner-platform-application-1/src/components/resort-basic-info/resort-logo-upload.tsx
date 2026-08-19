"use client"

import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Camera, ImageOff } from "lucide-react"
import { TypographyLabel } from "@/components/shared/typography"

interface ResortLogoUploadProps {
  logoUrl: string
  editable: boolean
  onChange: (url: string) => void
}

export function ResortLogoUpload({ logoUrl, editable, onChange }: ResortLogoUploadProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  function handlePick() {
    if (!editable) return
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    onChange(url)
  }

  return (
    <div className="space-y-2">
      <TypographyLabel>{t("basicInfo.logoSection")}</TypographyLabel>
      <button
        type="button"
        onClick={handlePick}
        disabled={!editable}
        className={`group relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted/40 transition-colors ${
          editable ? "cursor-pointer hover:border-primary/50" : "cursor-default"
        } ${!logoUrl ? "border-dashed" : ""}`}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={t("basicInfo.logoSection")}
            className="h-full w-full object-contain p-2"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
          />
        ) : (
          <ImageOff className="h-6 w-6 text-muted-foreground/40" />
        )}

        {editable && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/85 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5 text-foreground" />
            <span className="px-2 text-center text-[10px] font-medium leading-tight text-foreground">
              {logoUrl ? t("basicInfo.replaceLogo") : t("basicInfo.uploadLogo")}
            </span>
          </div>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
