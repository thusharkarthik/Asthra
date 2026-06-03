export const apiConfig = {
  gatewayUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "http://localhost:8010",
  coreAuthLoginPath: process.env.NEXT_PUBLIC_CORE_AUTH_LOGIN_PATH ?? "/api/core/api/v1/auth/login",
  coreAuthRegisterPath: process.env.NEXT_PUBLIC_CORE_AUTH_REGISTER_PATH ?? "/api/core/api/v1/auth/register",
  coreAuthMePath: process.env.NEXT_PUBLIC_CORE_AUTH_ME_PATH ?? "/api/core/api/v1/auth/me",
  timeoutMs: 30_000
};
