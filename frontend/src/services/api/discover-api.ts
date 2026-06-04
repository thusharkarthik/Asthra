import { apiRequest } from "@/services/api/client";
import type { FeatureRequest, FeatureRequestCreate, Feedback, FeedbackCreate, Idea, IdeaAIAnalysis, IdeaCreate, MVPPlan, RoadmapItem } from "@/types/discover";

const DISCOVER_PREFIX = "/api/discover/api/v1";

function toQuery(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const discoverApi = {
  listIdeas(accessToken: string, filters: { workspace_id?: number | null; project_id?: number | null; status?: string; limit?: number } = {}) {
    return apiRequest<Idea[]>(`${DISCOVER_PREFIX}/ideas${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createIdea(accessToken: string, payload: IdeaCreate) {
    return apiRequest<Idea>(`${DISCOVER_PREFIX}/ideas`, { method: "POST", authToken: accessToken, json: payload });
  },
  getIdea(accessToken: string, id: string | number) {
    return apiRequest<Idea>(`${DISCOVER_PREFIX}/ideas/${id}`, { method: "GET", authToken: accessToken });
  },
  listFeatureRequests(accessToken: string, filters: { workspace_id?: number | null; status?: string; limit?: number } = {}) {
    return apiRequest<FeatureRequest[]>(`${DISCOVER_PREFIX}/feature-requests${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createFeatureRequest(accessToken: string, payload: FeatureRequestCreate) {
    return apiRequest<FeatureRequest>(`${DISCOVER_PREFIX}/feature-requests`, { method: "POST", authToken: accessToken, json: payload });
  },
  listFeedback(accessToken: string, filters: { workspace_id?: number | null; limit?: number } = {}) {
    return apiRequest<Feedback[]>(`${DISCOVER_PREFIX}/feedback${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createFeedback(accessToken: string, payload: FeedbackCreate) {
    return apiRequest<Feedback>(`${DISCOVER_PREFIX}/feedback`, { method: "POST", authToken: accessToken, json: payload });
  },
  getMvpPlan(accessToken: string, ideaId: string | number) {
    return apiRequest<MVPPlan>(`${DISCOVER_PREFIX}/ideas/${ideaId}/mvp-plan`, { method: "GET", authToken: accessToken });
  },
  listRoadmapItems(accessToken: string, filters: { workspace_id?: number | null; status?: string; limit?: number } = {}) {
    return apiRequest<RoadmapItem[]>(`${DISCOVER_PREFIX}/roadmap-items${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createRoadmapItem(accessToken: string, payload: Partial<RoadmapItem> & { workspace_id: number; title: string }) {
    return apiRequest<RoadmapItem>(`${DISCOVER_PREFIX}/roadmap-items`, { method: "POST", authToken: accessToken, json: payload });
  },
  analyzeIdea(accessToken: string, ideaId: string | number) {
    return apiRequest<IdeaAIAnalysis>(`${DISCOVER_PREFIX}/ideas/${ideaId}/ai-analysis`, { method: "POST", authToken: accessToken });
  }
};
