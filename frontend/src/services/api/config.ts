export const apiConfig = {
  gatewayUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "http://localhost:8080",
  coreAuthLoginPath: process.env.NEXT_PUBLIC_CORE_AUTH_LOGIN_PATH ?? "/api/core/api/v1/auth/login",
  coreAuthRegisterPath: process.env.NEXT_PUBLIC_CORE_AUTH_REGISTER_PATH ?? "/api/core/api/v1/auth/register",
  coreAuthMePath: process.env.NEXT_PUBLIC_CORE_AUTH_ME_PATH ?? "/api/core/api/v1/auth/me",
  assistantChatPath: process.env.NEXT_PUBLIC_ASSISTANT_CHAT_PATH ?? "/api/ai/api/v1/assistant/chat",
  assistantSessionsPath: process.env.NEXT_PUBLIC_ASSISTANT_SESSIONS_PATH ?? "/api/ai/api/v1/assistant/sessions",
  workspaceSearchPath: process.env.NEXT_PUBLIC_WORKSPACE_SEARCH_PATH ?? "/api/memory/api/v1/workspace-search",
  timeoutMs: 30_000
};
