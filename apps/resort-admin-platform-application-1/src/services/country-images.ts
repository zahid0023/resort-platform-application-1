import { api } from "./api";

export interface MutationResponse {
  success: boolean;
  id: number;
}

export const countryImagesService = {
  // Overwrites any previous flag image server-side — there is no separate remove endpoint used by
  // this app; uploading a new image is the only way to change or clear the flag.
  upload(countryId: number, providerConfigId: number, file: File): Promise<MutationResponse> {
    const formData = new FormData();
    formData.append("provider_config_id", String(providerConfigId));
    formData.append("image", file);
    return api.postForm<MutationResponse>(`/countries/${countryId}/images`, formData);
  },
};
