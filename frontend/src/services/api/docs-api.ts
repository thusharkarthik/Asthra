import { apiRequest } from "@/services/api/client";
import type { Page, PageComment, PageCreate, PageFilters, PageUpdate, PageVersion, Space, SpaceCreate } from "@/types/docs";

const DOCS_PREFIX = "/api/docs/api/v1";

function toQuery(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const docsApi = {
  listSpaces(accessToken: string) {
    return apiRequest<Space[]>(`${DOCS_PREFIX}/spaces`, { method: "GET", authToken: accessToken });
  },
  createSpace(accessToken: string, payload: SpaceCreate) {
    return apiRequest<Space>(`${DOCS_PREFIX}/spaces`, { method: "POST", authToken: accessToken, json: payload });
  },
  getSpace(accessToken: string, id: string | number) {
    return apiRequest<Space>(`${DOCS_PREFIX}/spaces/${id}`, { method: "GET", authToken: accessToken });
  },
  listPages(accessToken: string, filters: PageFilters = {}) {
    return apiRequest<Page[]>(`${DOCS_PREFIX}/pages${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createPage(accessToken: string, payload: PageCreate) {
    return apiRequest<Page>(`${DOCS_PREFIX}/pages`, { method: "POST", authToken: accessToken, json: payload });
  },
  getPage(accessToken: string, id: string | number) {
    return apiRequest<Page>(`${DOCS_PREFIX}/pages/${id}`, { method: "GET", authToken: accessToken });
  },
  updatePage(accessToken: string, id: string | number, payload: PageUpdate) {
    return apiRequest<Page>(`${DOCS_PREFIX}/pages/${id}`, { method: "PATCH", authToken: accessToken, json: payload });
  },
  publishPage(accessToken: string, id: string | number, updatedById?: number | null) {
    return apiRequest<Page>(`${DOCS_PREFIX}/pages/${id}/publish${toQuery({ updated_by_id: updatedById })}`, { method: "POST", authToken: accessToken });
  },
  archivePage(accessToken: string, id: string | number, updatedById?: number | null) {
    return apiRequest<Page>(`${DOCS_PREFIX}/pages/${id}/archive${toQuery({ updated_by_id: updatedById })}`, { method: "POST", authToken: accessToken });
  },
  listPageVersions(accessToken: string, pageId: string | number) {
    return apiRequest<PageVersion[]>(`${DOCS_PREFIX}/pages/${pageId}/versions`, { method: "GET", authToken: accessToken });
  },
  listComments(accessToken: string, pageId: string | number) {
    return apiRequest<PageComment[]>(`${DOCS_PREFIX}/pages/${pageId}/comments`, { method: "GET", authToken: accessToken });
  },
  createComment(accessToken: string, pageId: string | number, payload: { user_id?: number | null; content: string }) {
    return apiRequest<PageComment>(`${DOCS_PREFIX}/pages/${pageId}/comments`, { method: "POST", authToken: accessToken, json: payload });
  },
  searchPages(accessToken: string, query: string) {
    return apiRequest<Page[]>(`${DOCS_PREFIX}/search/pages${toQuery({ q: query })}`, { method: "GET", authToken: accessToken });
  }
};
