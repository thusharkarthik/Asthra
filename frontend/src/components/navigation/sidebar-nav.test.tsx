import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarNav } from "@/components/navigation/sidebar-nav";

const navigationMock = (
  globalThis as typeof globalThis & {
    __asthraNavigationMock: { pathname: string; params: Record<string, string>; push: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> };
  }
).__asthraNavigationMock;

describe("SidebarNav", () => {
  beforeEach(() => {
    navigationMock.pathname = "/";
  });

  it("renders grouped platform navigation items", () => {
    render(<SidebarNav />);

    expect(screen.getByRole("region", { name: "Platform" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Work" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Operations" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /flow/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /docs/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
  });

  it("marks nested routes active", () => {
    navigationMock.pathname = "/docs/pages/1";
    render(<SidebarNav />);

    expect(screen.getByRole("link", { name: /docs/i })).toHaveAttribute("aria-current", "page");
  });
});
