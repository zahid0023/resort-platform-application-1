import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { Button, Card, CardContent } from "@resort/shadcn-ui";
import { toast } from "sonner";
import { countriesService } from "@/services/countries";
import { countryImagesService } from "@/services/country-images";
import {
  ImageHostingProviderConfigPickerDialog,
  type SelectedProviderConfig,
} from "@/components/image-hosting-providers/image-hosting-provider-config-picker-dialog";
import type { CountryDialogMode } from "./types";

const SVG_MIME = "image/svg+xml";

function isSvgFile(file: File): boolean {
  return file.type === SVG_MIME || file.name.toLowerCase().endsWith(".svg");
}

export interface CountryFlagImageProps {
  mode: CountryDialogMode;
  countryId?: number;
  /** `""` means no flag has been uploaded yet — read straight off the Country record. */
  flagUrl: string;
  onFlagUrlChange: (url: string) => void;
  onSaved?: () => void | Promise<void>;
  /** Sheet open state — used only to reset this section's local, session-only picker/draft state. */
  open: boolean;
}

// `flag_url` is persisted and returned by GET /countries/:id, so the current image is always known.
// There is no separate remove action — uploading a new image overwrites the previous one server-side
// (see "Upload Country Flag Image" in the API docs), so replacing is the only way to change the flag.
//
// The storage config picker is never shown up front — clicking Upload with no config chosen yet opens
// it, and the upload runs automatically the moment a config is picked. Once a config has been picked
// this session, it's reused silently for subsequent uploads (with a small "Change" affordance that
// reopens the picker without auto-uploading, for switching providers without acting on it yet).
export function CountryFlagImage({ mode, countryId, flagUrl, onFlagUrlChange, onSaved, open }: CountryFlagImageProps) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [autoUpload, setAutoUpload] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<SelectedProviderConfig | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The chosen-but-not-yet-uploaded file is previewed via a local object URL — revoked whenever it's
  // replaced or cleared so these don't pile up for the life of the page.
  useEffect(() => {
    if (!file) { setFilePreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) {
      setPickerOpen(false);
      setAutoUpload(false);
      setSelectedConfig(null);
      setFile(null);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  function handleFileChange(f: File | null) {
    if (f && !isSvgFile(f)) {
      toast.error(t("countryFlag.svgOnly"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(f);
  }

  function clearChosenFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function doUpload(config: SelectedProviderConfig) {
    if (countryId == null || !file) return;
    setUploading(true);
    try {
      await countryImagesService.upload(countryId, config.id, file);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const fresh = await countriesService.get(countryId);
      onFlagUrlChange(fresh.data.flag_url ?? "");
      toast.success(t("countryFlag.uploadedToast"));
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleUploadClick() {
    if (!file) { toast.error(t("countryFlag.fileRequired")); return; }
    if (selectedConfig) { doUpload(selectedConfig); return; }
    setAutoUpload(true);
    setPickerOpen(true);
  }

  // Picking a config either just updates the saved preference (opened via "Change") or, if it was
  // opened from an Upload click with no config chosen yet, immediately uploads.
  function handleConfigSelected(config: SelectedProviderConfig) {
    setSelectedConfig(config);
    if (autoUpload) doUpload(config);
    setAutoUpload(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {t("countryFlag.section")}
        </h3>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {mode === "create" ? (
            <p className="text-xs text-muted-foreground">{t("countryFlag.availableAfterCreate")}</p>
          ) : (
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={`group relative w-24 h-24 rounded-lg border overflow-hidden flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    filePreviewUrl || flagUrl ? "bg-muted/40" : "border-dashed bg-muted/30 hover:border-primary/40"
                  }`}
                >
                  {filePreviewUrl ? (
                    <img src={filePreviewUrl} alt={t("countryFlag.alt")} className="w-full h-full object-contain p-2" />
                  ) : flagUrl ? (
                    <img
                      src={flagUrl}
                      alt={t("countryFlag.alt")}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-[10px] px-1 text-center leading-tight">{t("countryFlag.clickToUpload")}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors group-hover:bg-black/40 group-hover:opacity-100">
                    <ImagePlus className="h-5 w-5 text-white" />
                  </div>
                </button>
                {file && !uploading && (
                  <button
                    type="button"
                    onClick={clearChosenFile}
                    title={t("common.cancel")}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,image/svg+xml"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                {!flagUrl && !file && (
                  <p className="text-xs text-muted-foreground">{t("countryFlag.promptUpload")}</p>
                )}
                <p className="text-[11px] text-muted-foreground">{t("countryFlag.svgHint")}</p>

                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs gap-1.5 w-full"
                  onClick={handleUploadClick}
                  disabled={uploading || !file}
                >
                  {uploading ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("countryFlag.uploading")}</>
                  ) : (
                    <><Upload className="h-3.5 w-3.5" /> {flagUrl ? t("countryFlag.replace") : t("countryFlag.upload")}</>
                  )}
                </Button>

                {selectedConfig && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {t("countryFlag.viaConfig", { config: selectedConfig.name })}{" "}
                    <button type="button" onClick={() => setPickerOpen(true)} className="underline hover:text-foreground">
                      {t("imageHostingProviderConfigPicker.change")}
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ImageHostingProviderConfigPickerDialog
        open={pickerOpen}
        onOpenChange={(v) => { setPickerOpen(v); if (!v) setAutoUpload(false); }}
        selectedConfigId={selectedConfig?.id}
        onSelect={handleConfigSelected}
      />
    </div>
  );
}
