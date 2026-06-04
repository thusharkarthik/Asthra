import { apiRequest } from "@/services/api/client";
import type { Dashboard, DashboardWidget, Envelope, InsightEvent, MetricDefinition, MetricSnapshot, Report, ReportRun, UsageMetric } from "@/types/insights";

const INSIGHTS_PREFIX = "/api/insights/api/v1";

function toQuery(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function enveloped<T>(promise: Promise<Envelope<T>>) {
  const response = await promise;
  return response.data;
}

export const insightsApi = {
  listDashboards(accessToken: string, filters: { workspace_id?: number | null; created_by_id?: number | null; limit?: number } = {}) {
    return enveloped(apiRequest<Envelope<Dashboard[]>>(`${INSIGHTS_PREFIX}/dashboards${toQuery(filters)}`, { method: "GET", authToken: accessToken }));
  },
  listDashboardWidgets(accessToken: string, dashboardId: string | number) {
    return enveloped(apiRequest<Envelope<DashboardWidget[]>>(`${INSIGHTS_PREFIX}/dashboards/${dashboardId}/widgets`, { method: "GET", authToken: accessToken }));
  },
  listMetricDefinitions(accessToken: string, filters: { workspace_id?: number | null; metric_key?: string; limit?: number } = {}) {
    return enveloped(apiRequest<Envelope<MetricDefinition[]>>(`${INSIGHTS_PREFIX}/metrics/definitions${toQuery(filters)}`, { method: "GET", authToken: accessToken }));
  },
  listMetricSnapshots(accessToken: string, filters: { workspace_id?: number | null; metric_key?: string; entity_type?: string; entity_id?: number | null; limit?: number } = {}) {
    return enveloped(apiRequest<Envelope<MetricSnapshot[]>>(`${INSIGHTS_PREFIX}/metrics/snapshots${toQuery(filters)}`, { method: "GET", authToken: accessToken }));
  },
  listReports(accessToken: string, filters: { workspace_id?: number | null; report_type?: string; status?: string; limit?: number } = {}) {
    return enveloped(apiRequest<Envelope<Report[]>>(`${INSIGHTS_PREFIX}/reports${toQuery(filters)}`, { method: "GET", authToken: accessToken }));
  },
  listReportRuns(accessToken: string, reportId: string | number) {
    return enveloped(apiRequest<Envelope<ReportRun[]>>(`${INSIGHTS_PREFIX}/reports/${reportId}/runs`, { method: "GET", authToken: accessToken }));
  },
  listInsightEvents(accessToken: string, filters: { workspace_id?: number | null; severity?: string; event_type?: string; limit?: number } = {}) {
    return enveloped(apiRequest<Envelope<InsightEvent[]>>(`${INSIGHTS_PREFIX}/insight-events${toQuery(filters)}`, { method: "GET", authToken: accessToken }));
  },
  listUsageMetrics(accessToken: string, filters: { workspace_id?: number | null; service_name?: string; metric_name?: string; limit?: number } = {}) {
    return enveloped(apiRequest<Envelope<UsageMetric[]>>(`${INSIGHTS_PREFIX}/usage-metrics${toQuery(filters)}`, { method: "GET", authToken: accessToken }));
  }
};
