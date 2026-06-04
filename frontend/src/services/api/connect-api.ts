import { apiRequest } from "@/services/api/client";
import type { APIConnection, Connector, Envelope, EventSubscription, Integration, IntegrationCreate, SyncJob, WebhookDelivery, WebhookEndpoint } from "@/types/connect";

const PREFIX = "/api/connect/api/v1";
const q = (params: Record<string, string | number | boolean | null | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== null && value !== undefined && value !== "") search.set(key, String(value)); });
  const text = search.toString();
  return text ? `?${text}` : "";
};
const unwrap = async <T>(promise: Promise<Envelope<T>>) => (await promise).data;

export const connectApi = {
  listIntegrations: (token: string, filters: { workspace_id?: number | null; provider?: string; status?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<Integration[]>>(`${PREFIX}/integrations${q(filters)}`, { method: "GET", authToken: token })),
  createIntegration: (token: string, payload: IntegrationCreate) => unwrap(apiRequest<Envelope<Integration>>(`${PREFIX}/integrations`, { method: "POST", authToken: token, json: payload })),
  listConnectors: (token: string, filters: { integration_id?: number | null; connector_type?: string; status?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<Connector[]>>(`${PREFIX}/connectors${q(filters)}`, { method: "GET", authToken: token })),
  listWebhooks: (token: string, filters: { workspace_id?: number | null; is_active?: boolean; limit?: number } = {}) => unwrap(apiRequest<Envelope<WebhookEndpoint[]>>(`${PREFIX}/webhooks${q(filters)}`, { method: "GET", authToken: token })),
  listWebhookDeliveries: (token: string, filters: { event_type?: string; delivery_status?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<WebhookDelivery[]>>(`${PREFIX}/webhook-deliveries${q(filters)}`, { method: "GET", authToken: token })),
  listEventSubscriptions: (token: string, filters: { workspace_id?: number | null; event_name?: string; is_active?: boolean; limit?: number } = {}) => unwrap(apiRequest<Envelope<EventSubscription[]>>(`${PREFIX}/event-subscriptions${q(filters)}`, { method: "GET", authToken: token })),
  listSyncJobs: (token: string, filters: { integration_id?: number | null; status?: string; job_type?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<SyncJob[]>>(`${PREFIX}/sync-jobs${q(filters)}`, { method: "GET", authToken: token })),
  listApiConnections: (token: string, filters: { workspace_id?: number | null; provider?: string; connection_status?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<APIConnection[]>>(`${PREFIX}/api-connections${q(filters)}`, { method: "GET", authToken: token }))
};
