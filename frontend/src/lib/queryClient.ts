import { QueryClient } from "@tanstack/react-query";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function shouldRetryQuery(failureCount: number, error: unknown) {
  const status = typeof error === "object" && error !== null && "status" in error ? Number((error as { status?: number }).status) : undefined;
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 1;
}

export function createAsthraQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery
      },
      mutations: {
        retry: false
      }
    }
  });
}

export function isSafeRequest(method?: string) {
  return SAFE_METHODS.has((method ?? "GET").toUpperCase());
}
