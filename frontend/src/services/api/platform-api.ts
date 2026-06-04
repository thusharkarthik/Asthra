import { apiRequest } from "@/services/api/client";
import type { ActivityItem, EntityReference, NotificationItem, WorkspaceDashboardSummary } from "@/types/platform";

type Envelope<T> = { success: boolean; data: T; message?: string | null; request_id?: string | null };
const PREFIX = "/api/platform";
const unwrap = async <T>(promise: Promise<Envelope<T>>) => (await promise).data;

export const platformApi = {
  listActivity: (token: string) => unwrap(apiRequest<Envelope<{ items: ActivityItem[] }>>(`${PREFIX}/activity`, { method: "GET", authToken: token })),
  listNotifications: (token: string) => unwrap(apiRequest<Envelope<{ items: NotificationItem[]; unread_count: number }>>(`${PREFIX}/notifications`, { method: "GET", authToken: token })),
  markNotificationRead: (token: string, id: string) => unwrap(apiRequest<Envelope<NotificationItem>>(`${PREFIX}/notifications/${id}/read`, { method: "PATCH", authToken: token })),
  dismissNotification: (token: string, id: string) => unwrap(apiRequest<Envelope<{ deleted: boolean }>>(`${PREFIX}/notifications/${id}`, { method: "DELETE", authToken: token })),
  listRecentItems: (token: string) => unwrap(apiRequest<Envelope<{ items: EntityReference[] }>>(`${PREFIX}/recent-items`, { method: "GET", authToken: token })),
  listFavorites: (token: string) => unwrap(apiRequest<Envelope<{ items: EntityReference[] }>>(`${PREFIX}/favorites`, { method: "GET", authToken: token })),
  listRelationships: (token: string) => unwrap(apiRequest<Envelope<{ items: unknown[] }>>(`${PREFIX}/relationships`, { method: "GET", authToken: token })),
  getDashboard: (token: string) => unwrap(apiRequest<Envelope<WorkspaceDashboardSummary>>(`${PREFIX}/dashboard`, { method: "GET", authToken: token })),
  getHealth: (token: string) => unwrap(apiRequest<Envelope<{ gateway: Record<string, unknown>; status: string; services: unknown[] }>>(`/platform/health`, { method: "GET", authToken: token }))
};
