"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { WorkspaceProvider } from "@/providers/workspace-provider";
import { ToastViewport } from "@/components/platform/toast-viewport";
import { PlatformContextProvider } from "@/context/platformContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <PlatformContextProvider>
            <WorkspaceProvider>
              {children}
              <ToastViewport />
            </WorkspaceProvider>
          </PlatformContextProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
