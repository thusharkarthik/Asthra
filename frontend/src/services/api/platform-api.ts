import { apiRequest } from "@/services/api/client";
import type { ActivityItem, CrossModuleLink, EntityReference, NotificationItem, OperationalEntityType, RelationshipCreate, WorkspaceDashboardSummary } from "@/types/platform";

type Envelope<T> = { success: boolean; data: T; message?: string | null; request_id?: string | null };
const PREFIX = "/api/platform";
const unwrap = async <T>(promise: Promise<Envelope<T> | T>) => {
  const response = await promise;
  return response && typeof response === "object" && "data" in response ? response.data : response;
};
const normalizeItems = <T>(value: { items?: T[] } | T[] | undefined) => Array.isArray(value) ? { items: value } : { items: value?.items ?? [] };

export const platformApi = {
  listActivity: (token: string) => unwrap(apiRequest<Envelope<{ items: ActivityItem[] }>>(`${PREFIX}/activity`, { method: "GET", authToken: token })),
  listNotifications: (token: string) => unwrap(apiRequest<Envelope<{ items: NotificationItem[]; unread_count: number }>>(`${PREFIX}/notifications`, { method: "GET", authToken: token })),
  markNotificationRead: (token: string, id: string) => unwrap(apiRequest<Envelope<NotificationItem>>(`${PREFIX}/notifications/${id}/read`, { method: "PATCH", authToken: token })),
  dismissNotification: (token: string, id: string) => unwrap(apiRequest<Envelope<{ deleted: boolean }>>(`${PREFIX}/notifications/${id}`, { method: "DELETE", authToken: token })),
  listRecentItems: (token: string) => unwrap(apiRequest<Envelope<{ items: EntityReference[] }>>(`${PREFIX}/recent-items`, { method: "GET", authToken: token })),
  listFavorites: (token: string) => unwrap(apiRequest<Envelope<{ items: EntityReference[] }>>(`${PREFIX}/favorites`, { method: "GET", authToken: token })),
  listRelationships: async (token: string) => normalizeItems<CrossModuleLink>(await unwrap<{ items: CrossModuleLink[] } | CrossModuleLink[]>(apiRequest<Envelope<{ items: CrossModuleLink[] }> | CrossModuleLink[]>(`${PREFIX}/relationships`, { method: "GET", authToken: token }))),
  listEntityRelationships: async (token: string, entityType: OperationalEntityType, entityId: string | number) => normalizeItems<CrossModuleLink>(await unwrap<{ items: CrossModuleLink[] } | CrossModuleLink[]>(apiRequest<Envelope<{ items: CrossModuleLink[] }> | CrossModuleLink[]>(`${PREFIX}/relationships/entity/${entityType}/${entityId}`, { method: "GET", authToken: token }))),
  createRelationship: (token: string, payload: RelationshipCreate) => unwrap(apiRequest<Envelope<CrossModuleLink>>(`${PREFIX}/relationships`, { method: "POST", authToken: token, json: payload })),
  deleteRelationship: (token: string, id: string) => unwrap(apiRequest<Envelope<{ deleted: boolean }>>(`${PREFIX}/relationships/${id}`, { method: "DELETE", authToken: token })),
  search: (token: string, filters: { q?: string; module?: string; entity_type?: string } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    const query = params.toString();
    return unwrap(apiRequest<Envelope<{ items: EntityReference[] }>>(`${PREFIX}/search${query ? `?${query}` : ""}`, { method: "GET", authToken: token }));
  },
  getDashboard: (token: string) => unwrap(apiRequest<Envelope<WorkspaceDashboardSummary>>(`${PREFIX}/dashboard`, { method: "GET", authToken: token })),
  getHealth: (token: string) => unwrap(apiRequest<Envelope<{ gateway: Record<string, unknown>; status: string; services: unknown[] }>>(`/platform/health`, { method: "GET", authToken: token }))
};
