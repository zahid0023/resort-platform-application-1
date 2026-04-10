"use client"

import { UIBlockRenderer } from "ui-blocks"

interface UiBlockPreviewProps {
  uiBlockKey: string
}

export function UiBlockPreview({ uiBlockKey }: UiBlockPreviewProps) {
  return (
    <div className="relative w-full aspect-video overflow-hidden bg-white pointer-events-none">
      <div className="absolute inset-0 w-[200%] origin-top-left scale-[0.5]">
        <UIBlockRenderer uiBlockKey={uiBlockKey} />
      </div>
    </div>
  )
}