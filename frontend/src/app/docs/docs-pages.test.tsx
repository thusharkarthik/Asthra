import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DocsPage from "@/app/docs/page";
import PageDetail from "@/app/docs/pages/[id]/page";
import PagesPage from "@/app/docs/pages/page";
import SpacesPage from "@/app/docs/spaces/page";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const navigationMock = (
  globalThis as typeof globalThis & {
    __asthraNavigationMock: { pathname: string; params: Record<string, string>; push: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> };
  }
).__asthraNavigationMock;

function renderWithQuery(ui: React.ReactNode) {
  return render(<QueryProvider>{ui}</QueryProvider>);
}

function mockDocsFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/pages/5/comments")) {
      return new Response(JSON.stringify([{ id: 1, page_id: 5, user_id: 1, content: "Helpful page" }]), { status: 200 });
    }
    if (url.includes("/pages/5")) {
      return new Response(JSON.stringify({ id: 5, space_id: 1, title: "Frontend Notes", content: "Docs page content", status: "draft" }), { status: 200 });
    }
    if (url.includes("/spaces")) {
      return new Response(JSON.stringify([{ id: 1, workspace_id: 2, name: "Engineering", description: "Team docs" }]), { status: 200 });
    }
    if (url.includes("/pages") || url.includes("/search/pages")) {
      return new Response(JSON.stringify([{ id: 5, space_id: 1, title: "Frontend Notes", content: "Docs page content", status: "draft" }]), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  });
}

describe("Docs frontend screens", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigationMock.params = {};
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useWorkspaceStore.setState({ selectedWorkspaceId: 2, selectedProjectId: 3 });
    mockDocsFetch();
  });

  it("renders Docs dashboard", async () => {
    renderWithQuery(<DocsPage />);

    expect(screen.getByRole("heading", { name: "Docs" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Frontend Notes")).toBeInTheDocument());
  });

  it("renders spaces page", async () => {
    renderWithQuery(<SpacesPage />);

    expect(screen.getByRole("heading", { name: "Spaces" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Engineering")).toBeInTheDocument());
  });

  it("renders pages page", async () => {
    renderWithQuery(<PagesPage />);

    expect(screen.getByRole("heading", { name: "Pages" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Frontend Notes")).toBeInTheDocument());
  });

  it("renders page detail with mock data", async () => {
    navigationMock.params = { id: "5" };
    renderWithQuery(<PageDetail />);

    await waitFor(() => expect(screen.getByText("Docs page content")).toBeInTheDocument());
    expect(screen.getByText("Helpful page")).toBeInTheDocument();
  });
});
