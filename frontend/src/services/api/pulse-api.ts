import { apiRequest } from "@/services/api/client";
import type {
  Alert,
  EscalationPolicy,
  IncidentAISummary,
  OnCallSchedule,
  Postmortem,
  PulseIncident,
  PulseIncidentCreate,
  StatusPage,
  StatusPageComponent,
  TimelineEvent
} from "@/types/pulse";

const PULSE_PREFIX = "/api/pulse/api/v1";

function toQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const pulseApi = {
  listAlerts(accessToken: string, filters: { workspace_id?: number | null; status?: string; severity?: string; limit?: number } = {}) {
    return apiRequest<Alert[]>(`${PULSE_PREFIX}/alerts${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  listIncidents(accessToken: string, filters: { workspace_id?: number | null; status?: string; severity?: string; limit?: number } = {}) {
    return apiRequest<PulseIncident[]>(`${PULSE_PREFIX}/incidents${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createIncident(accessToken: string, payload: PulseIncidentCreate) {
    return apiRequest<PulseIncident>(`${PULSE_PREFIX}/incidents`, { method: "POST", authToken: accessToken, json: payload });
  },
  getIncident(accessToken: string, id: string | number) {
    return apiRequest<PulseIncident>(`${PULSE_PREFIX}/incidents/${id}`, { method: "GET", authToken: accessToken });
  },
  listTimeline(accessToken: string, incidentId: string | number) {
    return apiRequest<TimelineEvent[]>(`${PULSE_PREFIX}/incidents/${incidentId}/timeline`, { method: "GET", authToken: accessToken });
  },
  listOnCallSchedules(accessToken: string) {
    return apiRequest<OnCallSchedule[]>(`${PULSE_PREFIX}/on-call-schedules`, { method: "GET", authToken: accessToken });
  },
  listEscalationPolicies(accessToken: string) {
    return apiRequest<EscalationPolicy[]>(`${PULSE_PREFIX}/escalation-policies`, { method: "GET", authToken: accessToken });
  },
  listStatusPages(accessToken: string, filters: { workspace_id?: number | null; is_public?: boolean; limit?: number } = {}) {
    return apiRequest<StatusPage[]>(`${PULSE_PREFIX}/status-pages${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  listStatusPageComponents(accessToken: string, statusPageId: string | number) {
    return apiRequest<StatusPageComponent[]>(`${PULSE_PREFIX}/status-pages/${statusPageId}/components`, { method: "GET", authToken: accessToken });
  },
  getPostmortem(accessToken: string, incidentId: string | number) {
    return apiRequest<Postmortem>(`${PULSE_PREFIX}/incidents/${incidentId}/postmortem`, { method: "GET", authToken: accessToken });
  },
  summarizeIncident(accessToken: string, incidentId: string | number) {
    return apiRequest<IncidentAISummary>(`${PULSE_PREFIX}/incidents/${incidentId}/ai-summary`, { method: "POST", authToken: accessToken });
  }
};
