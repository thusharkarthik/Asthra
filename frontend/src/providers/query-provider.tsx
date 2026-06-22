"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { createAsthraQueryClient } from "@/lib/queryClient";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => createAsthraQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
