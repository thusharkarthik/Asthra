export type Envelope<T> = { success: boolean; data: T; message?: string | null; request_id?: string | null };
export type SecurityPolicy = { id: number; workspace_id: number; name: string; policy_type: string; status: string; description?: string | null; rules?: Record<string, unknown> | null };
export type AccessReview = { id: number; workspace_id: number; name: string; status: string; reviewer_id?: number | null; scope?: string | null };
export type ComplianceCheck = { id: number; workspace_id: number; framework: string; control: string; status: string; notes?: string | null };
export type AuditEvent = { id: number; workspace_id?: number | null; actor_user_id?: number | null; entity_type?: string | null; entity_id?: number | null; action: string; severity: string; metadata?: Record<string, unknown> | null };
export type DataRetentionPolicy = { id: number; workspace_id: number; name: string; data_type: string; retention_days: number; status: string; description?: string | null };
export type RiskFinding = { id: number; workspace_id: number; title: string; description?: string | null; severity: string; status: string; source?: string | null; owner_id?: number | null };
export type SecurityException = { id: number; workspace_id: number; title: string; description?: string | null; status: string; requested_by_id?: number | null };
