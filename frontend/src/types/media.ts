export type Envelope<T> = { success: boolean; data: T; message?: string | null; request_id?: string | null };
export type MediaAsset = { id: number; workspace_id: number; uploaded_by_id?: number | null; title: string; description?: string | null; asset_type: string; file_url: string; file_name?: string | null; mime_type?: string | null; file_size?: number | null; metadata?: Record<string, unknown> | null };
export type MediaAssetCreate = { workspace_id: number; uploaded_by_id?: number | null; title: string; description?: string | null; asset_type: string; file_url: string; file_name?: string | null; mime_type?: string | null; file_size?: number | null; metadata?: Record<string, unknown> | null };
export type MediaCollection = { id: number; workspace_id: number; name: string; description?: string | null; created_by_id?: number | null };
export type MediaTranscript = { id: number; asset_id: number; transcript_text: string; language?: string | null; source?: string | null };
export type MediaAnnotation = { id: number; asset_id: number; annotation_type: string; content: string; created_by_id?: number | null };
export type MediaProcessingJob = { id: number; asset_id: number; job_type: string; status: string; result?: Record<string, unknown> | null; error_message?: string | null };
export type MediaTag = { id: number; name: string };
