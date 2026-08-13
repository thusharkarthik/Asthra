import { apiRequest } from "@/services/api/client";
import type { Envelope, MediaAnnotation, MediaAsset, MediaAssetCreate, MediaCollection, MediaProcessingJob, MediaTag, MediaTranscript } from "@/types/media";

const PREFIX = "/api/media/api/v1";
const q = (params: Record<string, string | number | null | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== null && value !== undefined && value !== "") search.set(key, String(value)); });
  const text = search.toString();
  return text ? `?${text}` : "";
};
const unwrap = async <T>(promise: Promise<Envelope<T>>) => (await promise).data;

export const mediaApi = {
  listAssets: (token: string, filters: { workspace_id?: number | null; asset_type?: string; uploaded_by_id?: number | null; limit?: number } = {}) => unwrap(apiRequest<Envelope<MediaAsset[]>>(`${PREFIX}/media-assets${q(filters)}`, { method: "GET", authToken: token })),
  createAsset: (token: string, payload: MediaAssetCreate) => unwrap(apiRequest<Envelope<MediaAsset>>(`${PREFIX}/media-assets`, { method: "POST", authToken: token, json: payload })),
  getAsset: (token: string, id: string | number) => unwrap(apiRequest<Envelope<MediaAsset>>(`${PREFIX}/media-assets/${id}`, { method: "GET", authToken: token })),
  listCollections: (token: string, filters: { workspace_id?: number | null; created_by_id?: number | null; limit?: number } = {}) => unwrap(apiRequest<Envelope<MediaCollection[]>>(`${PREFIX}/media-collections${q(filters)}`, { method: "GET", authToken: token })),
  listTranscripts: (token: string, assetId: string | number) => unwrap(apiRequest<Envelope<MediaTranscript[]>>(`${PREFIX}/media-assets/${assetId}/transcripts`, { method: "GET", authToken: token })),
  listAnnotations: (token: string, assetId: string | number) => unwrap(apiRequest<Envelope<MediaAnnotation[]>>(`${PREFIX}/media-assets/${assetId}/annotations`, { method: "GET", authToken: token })),
  listProcessingJobs: (token: string, filters: { asset_id?: number | null; status?: string; job_type?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<MediaProcessingJob[]>>(`${PREFIX}/processing-jobs${q(filters)}`, { method: "GET", authToken: token })),
  listTags: (token: string) => unwrap(apiRequest<Envelope<MediaTag[]>>(`${PREFIX}/media-tags`, { method: "GET", authToken: token })),
  listAssetTags: (token: string, assetId: string | number) => unwrap(apiRequest<Envelope<MediaTag[]>>(`${PREFIX}/media-assets/${assetId}/tags`, { method: "GET", authToken: token }))
};
