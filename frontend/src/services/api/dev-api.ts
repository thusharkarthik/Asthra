import { apiRequest } from "@/services/api/client";
import type { Deployment, Environment, PullRequest, Release, ReleaseAISummary, Repository, ServiceCatalogItem, ServiceDependency, ServiceOwner } from "@/types/dev";

const DEV_PREFIX = "/api/dev/api/v1";

function toQuery(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const devApi = {
  listRepositories(accessToken: string, filters: { workspace_id?: number | null; provider?: string; project_id?: number | null; limit?: number } = {}) {
    return apiRequest<Repository[]>(`${DEV_PREFIX}/repositories${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  listPullRequests(accessToken: string, filters: { repository_id?: number | null; status?: string; author_id?: number | null; limit?: number } = {}) {
    return apiRequest<PullRequest[]>(`${DEV_PREFIX}/pull-requests${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  listEnvironments(accessToken: string, workspaceId?: number | null) {
    return apiRequest<Environment[]>(`${DEV_PREFIX}/environments${toQuery({ workspace_id: workspaceId })}`, { method: "GET", authToken: accessToken });
  },
  listDeployments(accessToken: string, filters: { workspace_id?: number | null; environment_id?: number | null; status?: string; service_id?: number | null; limit?: number } = {}) {
    return apiRequest<Deployment[]>(`${DEV_PREFIX}/deployments${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  listReleases(accessToken: string, filters: { workspace_id?: number | null; status?: string; service_id?: number | null; limit?: number } = {}) {
    return apiRequest<Release[]>(`${DEV_PREFIX}/releases${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  summarizeRelease(accessToken: string, releaseId: string | number) {
    return apiRequest<ReleaseAISummary>(`${DEV_PREFIX}/releases/${releaseId}/ai-summary`, { method: "POST", authToken: accessToken });
  },
  listServices(accessToken: string, filters: { workspace_id?: number | null; owner_id?: number | null; lifecycle_status?: string; limit?: number } = {}) {
    return apiRequest<ServiceCatalogItem[]>(`${DEV_PREFIX}/services${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  getService(accessToken: string, serviceId: string | number) {
    return apiRequest<ServiceCatalogItem>(`${DEV_PREFIX}/services/${serviceId}`, { method: "GET", authToken: accessToken });
  },
  listServiceOwners(accessToken: string, serviceId: string | number) {
    return apiRequest<ServiceOwner[]>(`${DEV_PREFIX}/services/${serviceId}/owners`, { method: "GET", authToken: accessToken });
  },
  listServiceDependencies(accessToken: string, serviceId: string | number) {
    return apiRequest<ServiceDependency[]>(`${DEV_PREFIX}/services/${serviceId}/dependencies`, { method: "GET", authToken: accessToken });
  }
};
