import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/"
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: vi.fn()
  }),
  ThemeProvider: ({ children }: { children: ReactNode }) => children
}));
