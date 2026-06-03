"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);

  useEffect(() => {
    if (!hasHydrated || !accessToken) {
      return;
    }

    loadCurrentUser().catch(() => {
      // The store clears expired sessions and exposes the user-facing error.
    });
  }, [accessToken, hasHydrated, loadCurrentUser]);

  return <>{children}</>;
}
