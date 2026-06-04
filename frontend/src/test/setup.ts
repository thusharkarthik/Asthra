import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { vi } from "vitest";

const navigationMock = vi.hoisted(() => ({
  pathname: "/",
  params: {} as Record<string, string>,
  push: vi.fn(),
  replace: vi.fn()
}));

(globalThis as typeof globalThis & { __asthraNavigationMock: typeof navigationMock }).__asthraNavigationMock =
  navigationMock;

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useParams: () => navigationMock.params,
  useRouter: () => ({
    push: navigationMock.push,
    replace: navigationMock.replace
  })
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: vi.fn()
  }),
  ThemeProvider: ({ children }: { children: ReactNode }) => children
}));
