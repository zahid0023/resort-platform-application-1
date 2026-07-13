import { api } from "./api"

export interface ResortImage {
  id: number
  resort_id: number
  external_id: string | null
  url: string
  caption: string | null
  sort_order: number
}

export interface ResortImageFull extends ResortImage {
  config_id: number
}

export interface ResortImageListResponse {
  data: ResortImage[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface UploadImageMeta {
  client_image_id: string
  caption?: string
  is_default?: boolean
  sort_order?: number
}

export interface MutationResponse {
  success: boolean
  id: number
}

export const resortImagesService = {
  list(resortId: number, params: { page?: number; size?: number } = {}): Promise<ResortImageListResponse> {
    const { page = 0, size = 50 } = params
    const q = new URLSearchParams({ page: String(page), size: String(size), sort_by: "sortOrder", sort_dir: "ASC" })
    return api.get<ResortImageListResponse>(`/resorts/${resortId}/images?${q}`)
  },

  get(resortId: number, id: number): Promise<{ resort_image: ResortImageFull }> {
    return api.get(`/resorts/${resortId}/images/${id}`)
  },

  upload(resortId: number, configId: number, files: File[], meta: UploadImageMeta[]): Promise<ResortImage[]> {
    const formData = new FormData()
    for (const file of files) formData.append("images", file)
    formData.append("meta", new Blob([JSON.stringify(meta)], { type: "application/json" }))
    return api.postForm<ResortImage[]>(`/resorts/${resortId}/images?config_id=${configId}`, formData)
  },

  update(resortId: number, id: number, body: { caption?: string | null; sort_order: number }): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resorts/${resortId}/images/${id}`, body)
  },

  remove(resortId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resorts/${resortId}/images/${id}`)
  },
}
