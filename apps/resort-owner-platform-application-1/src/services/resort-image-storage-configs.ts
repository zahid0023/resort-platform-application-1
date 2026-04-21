import { api } from "./api"

export type ImageHostingProvider = "S3" | "CLOUDINARY"

export const PROVIDER_FIELDS: Record<ImageHostingProvider, { key: string; label: string; secret?: boolean }[]> = {
  S3: [
    { key: "bucket",     label: "Bucket name" },
    { key: "region",     label: "Region (e.g. ap-southeast-1)" },
    { key: "access_key", label: "Access Key ID",     secret: false },
    { key: "secret_key", label: "Secret Access Key", secret: true  },
  ],
  CLOUDINARY: [
    { key: "cloud_name", label: "Cloud name" },
    { key: "api_key",    label: "API Key" },
    { key: "api_secret", label: "API Secret", secret: true },
  ],
}

export interface CreateImageStorageConfigRequest {
  provider: ImageHostingProvider
  config: Record<string, string>
}

export interface CreateImageStorageConfigResponse {
  success: boolean
  id: number
}

export const createImageStorageConfig = (
  resortId: number,
  body: CreateImageStorageConfigRequest,
): Promise<CreateImageStorageConfigResponse> =>
  api.post<CreateImageStorageConfigResponse>(
    `/resorts/${resortId}/resort-image-storage-configs`,
    body,
  )
