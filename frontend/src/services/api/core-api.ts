import { apiRequest } from "@/services/api/client";
import type { CoreUser, Organization } from "@/types/core";

export const coreApi = {
  currentUser(accessToken: string) {
    return apiRequest<CoreUser>("/api/core/api/v1/auth/me", {
      method: "GET",
      authToken: accessToken
    });
  },
  listOrganizations(accessToken: string) {
    return apiRequest<Organization[]>("/api/core/api/v1/organizations", {
      method: "GET",
      authToken: accessToken
    });
  }
};
