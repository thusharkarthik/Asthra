import { apiRequest } from "@/services/api/client";
import type { AccessReview, AuditEvent, ComplianceCheck, DataRetentionPolicy, Envelope, RiskFinding, SecurityException, SecurityPolicy } from "@/types/guard";

const PREFIX = "/api/guard/api/v1";
const q = (params: Record<string, string | number | null | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== null && value !== undefined && value !== "") search.set(key, String(value)); });
  const text = search.toString();
  return text ? `?${text}` : "";
};
const unwrap = async <T>(promise: Promise<Envelope<T>>) => (await promise).data;

export const guardApi = {
  listPolicies: (token: string, filters: { workspace_id?: number | null; policy_type?: string; status?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<SecurityPolicy[]>>(`${PREFIX}/security-policies${q(filters)}`, { method: "GET", authToken: token })),
  listAccessReviews: (token: string, filters: { workspace_id?: number | null; status?: string; reviewer_id?: number | null; limit?: number } = {}) => unwrap(apiRequest<Envelope<AccessReview[]>>(`${PREFIX}/access-reviews${q(filters)}`, { method: "GET", authToken: token })),
  listComplianceChecks: (token: string, filters: { workspace_id?: number | null; framework?: string; status?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<ComplianceCheck[]>>(`${PREFIX}/compliance-checks${q(filters)}`, { method: "GET", authToken: token })),
  listAuditEvents: (token: string, filters: { workspace_id?: number | null; entity_type?: string; action?: string; severity?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<AuditEvent[]>>(`${PREFIX}/audit-events${q(filters)}`, { method: "GET", authToken: token })),
  listRetentionPolicies: (token: string, filters: { workspace_id?: number | null; data_type?: string; status?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<DataRetentionPolicy[]>>(`${PREFIX}/data-retention-policies${q(filters)}`, { method: "GET", authToken: token })),
  listRiskFindings: (token: string, filters: { workspace_id?: number | null; severity?: string; status?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<RiskFinding[]>>(`${PREFIX}/risk-findings${q(filters)}`, { method: "GET", authToken: token })),
  listSecurityExceptions: (token: string, filters: { workspace_id?: number | null; status?: string; requested_by_id?: number | null; limit?: number } = {}) => unwrap(apiRequest<Envelope<SecurityException[]>>(`${PREFIX}/security-exceptions${q(filters)}`, { method: "GET", authToken: token }))
};
