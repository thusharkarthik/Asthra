import { apiRequest } from "@/services/api/client";
import { apiConfig } from "@/services/api/config";
import type { CoreUser, TokenResponse } from "@/types/core";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  full_name?: string | null;
};

export const authApi = {
  login(payload: LoginPayload) {
    return apiRequest<TokenResponse>(apiConfig.coreAuthLoginPath, {
      method: "POST",
      json: payload
    });
  },
  register(payload: RegisterPayload) {
    return apiRequest<CoreUser>(apiConfig.coreAuthRegisterPath, {
      method: "POST",
      json: payload
    });
  },
  me(accessToken: string) {
    return apiRequest<CoreUser>(apiConfig.coreAuthMePath, {
      method: "GET",
      authToken: accessToken
    });
  }
};
