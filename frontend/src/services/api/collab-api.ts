import { apiRequest } from "@/services/api/client";
import type { ActivityStreamItem, Announcement, AnnouncementCreate, Mention, Reaction, TeamUpdate, Thread, ThreadCreate, ThreadMessage } from "@/types/collab";

const COLLAB_PREFIX = "/api/collab/api/v1";

function toQuery(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const collabApi = {
  listThreads(accessToken: string, filters: { workspace_id?: number | null; project_id?: number | null; entity_type?: string; created_by_id?: number | null; limit?: number } = {}) {
    return apiRequest<Thread[]>(`${COLLAB_PREFIX}/threads${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createThread(accessToken: string, payload: ThreadCreate) {
    return apiRequest<Thread>(`${COLLAB_PREFIX}/threads`, { method: "POST", authToken: accessToken, json: payload });
  },
  getThread(accessToken: string, threadId: string | number) {
    return apiRequest<Thread>(`${COLLAB_PREFIX}/threads/${threadId}`, { method: "GET", authToken: accessToken });
  },
  listMessages(accessToken: string, threadId: string | number) {
    return apiRequest<ThreadMessage[]>(`${COLLAB_PREFIX}/threads/${threadId}/messages`, { method: "GET", authToken: accessToken });
  },
  createMessage(accessToken: string, threadId: string | number, payload: { author_id?: number | null; content: string }) {
    return apiRequest<ThreadMessage>(`${COLLAB_PREFIX}/threads/${threadId}/messages`, { method: "POST", authToken: accessToken, json: payload });
  },
  listMentions(accessToken: string, filters: { workspace_id?: number | null; mentioned_user_id?: number | null; limit?: number } = {}) {
    return apiRequest<Mention[]>(`${COLLAB_PREFIX}/mentions${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  listReactions(accessToken: string, filters: { workspace_id?: number | null; entity_type?: string; entity_id?: number | null; limit?: number } = {}) {
    return apiRequest<Reaction[]>(`${COLLAB_PREFIX}/reactions${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  listAnnouncements(accessToken: string, filters: { workspace_id?: number | null; created_by_id?: number | null; status?: string; limit?: number } = {}) {
    return apiRequest<Announcement[]>(`${COLLAB_PREFIX}/announcements${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createAnnouncement(accessToken: string, payload: AnnouncementCreate) {
    return apiRequest<Announcement>(`${COLLAB_PREFIX}/announcements`, { method: "POST", authToken: accessToken, json: payload });
  },
  listActivity(accessToken: string, filters: { workspace_id?: number | null; project_id?: number | null; entity_type?: string; actor_user_id?: number | null; limit?: number } = {}) {
    return apiRequest<ActivityStreamItem[]>(`${COLLAB_PREFIX}/activity-stream${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  listTeamUpdates(accessToken: string, filters: { workspace_id?: number | null; team_id?: number | null; status?: string; limit?: number } = {}) {
    return apiRequest<TeamUpdate[]>(`${COLLAB_PREFIX}/team-updates${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  }
};
