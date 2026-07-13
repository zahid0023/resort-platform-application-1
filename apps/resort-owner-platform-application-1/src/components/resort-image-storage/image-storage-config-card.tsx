"use client"

import { Eye, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge, Button, Card } from "@resort/shadcn-ui"
import type { ResortImageHostingConfig } from "@/services/resort-image-storage-configs"

interface ImageStorageConfigCardProps {
  config: ResortImageHostingConfig
  onView?: (config: ResortImageHostingConfig) => void
  onDelete?: (config: ResortImageHostingConfig) => void
}

export function ImageStorageConfigCard({ config, onView, onDelete }: ImageStorageConfigCardProps) {
  const { t } = useTranslation()

  const avatarText = config.provider.slice(0, 3)
  const configKeyCount = Object.keys(config.config).length

  const handleAction = (
    e: React.MouseEvent,
    handler?: (c: ResortImageHostingConfig) => void,
  ) => {
    e.stopPropagation()
    e.preventDefault()
    handler?.(config)
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(config)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onView?.(config)
        }
      }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs">
            {avatarText}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{config.name}</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
              {config.provider}
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onView && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => handleAction(e, onView)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => handleAction(e, onDelete)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">ID #{config.id}</Badge>
        <span className="text-xs text-muted-foreground">
          {t("imageStorage.configKeys", { count: configKeyCount })}
        </span>
      </div>
    </Card>
  )
}
