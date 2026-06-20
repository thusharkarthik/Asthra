import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DocsPage from "@/app/docs/page";
import DocsFavoritesPage from "@/app/docs/favorites/page";
import PageDetail from "@/app/docs/pages/[id]/page";
import PagesPage from "@/app/docs/pages/page";
import DocsRecentPage from "@/app/docs/recent/page";
import DocsSearchPage from "@/app/docs/search/page";
import SpaceDetailPage from "@/app/docs/spaces/[id]/page";
import SpacesPage from "@/app/docs/spaces/page";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useRecentItemsStore } from "@/stores/recent-items-store";
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
    if (url.includes("/pages/5/versions")) {
      return new Response(JSON.stringify([{ id: 3, page_id: 5, version_number: 1, title: "Frontend Notes", content: "Docs page content", created_by_id: 1, created_at: "2026-06-04T10:00:00.000Z" }]), { status: 200 });
    }
    if (url.includes("/pages/5/flow-work-items")) {
      return new Response(JSON.stringify([{ id: 11, docs_page_id: 5, flow_work_item_id: 9, flow_item_type: "story", title: "Story: Frontend Notes", status: "1", assignee_id: null, priority_id: 2 }]), { status: 200 });
    }
    if (url.includes("/pages/5")) {
      return new Response(JSON.stringify({ id: 5, space_id: 1, title: "Frontend Notes", content: "Docs page content", status: "draft", updated_at: "2026-06-04T10:00:00.000Z" }), { status: 200 });
    }
    if (url.includes("/spaces/1")) {
      return new Response(JSON.stringify({ id: 1, workspace_id: 2, name: "Engineering", description: "Team docs", updated_at: "2026-06-04T10:00:00.000Z" }), { status: 200 });
    }
    if (url.includes("/spaces")) {
      return new Response(JSON.stringify([{ id: 1, workspace_id: 2, name: "Engineering", description: "Team docs" }]), { status: 200 });
    }
    if (url.includes("/api/discover/api/v1/ideas")) {
      return new Response(JSON.stringify([{ id: 7, workspace_id: 2, project_id: 3, title: "Frontend Notes idea", description: "Docs page content", status: "approved", created_by_id: 1 }]), { status: 200 });
    }
    if (url.includes("/api/flow/api/v1/work-items")) {
      return new Response(JSON.stringify([{ id: 9, project_id: 3, title: "Frontend Notes work item", description: "Docs page content", release_id: 6 }]), { status: 200 });
    }
    if (url.includes("/api/flow/api/v1/releases")) {
      return new Response(JSON.stringify([{ id: 6, project_id: 3, name: "Frontend v1", status: "planned" }]), { status: 200 });
    }
    if (url.includes("/pages") || url.includes("/search/pages")) {
      return new Response(JSON.stringify([
        { id: 5, space_id: 1, title: "Frontend Notes", content: "Docs page content", status: "draft", updated_at: "2026-06-04T10:00:00.000Z" },
        { id: 6, space_id: 1, parent_page_id: 5, title: "Frontend Child Notes", content: "Nested docs content", status: "published", updated_at: "2026-06-04T11:00:00.000Z" }
      ]), { status: 200 });
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
    useWorkspaceStore.setState({
      organizations: [{ id: 1, name: "Acme" }],
      workspaces: [{ id: 2, organization_id: 1, name: "Workspace" }],
      selectedOrganizationId: 1,
      selectedWorkspaceId: 2,
      selectedProjectId: 3
    });
    useFavoritesStore.setState({
      favorites: [{ source: "docs", entity_type: "docs_page", entity_id: 5, title: "Frontend Notes", href: "/docs/pages/5", favorited_at: "2026-06-04T10:00:00.000Z" }]
    });
    useRecentItemsStore.setState({
      viewed: [{ source: "docs", entity_type: "docs_page", entity_id: 5, title: "Frontend Notes", href: "/docs/pages/5", viewed_at: "2026-06-04T10:00:00.000Z" }],
      modified: []
    });
    mockDocsFetch();
  });

  it("renders Docs dashboard", async () => {
    navigationMock.pathname = "/docs";
    renderWithQuery(<DocsPage />);

    expect(screen.getByRole("heading", { name: "Docs" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Total Spaces")).toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByText("Frontend Notes").length).toBeGreaterThan(0));
    expect(screen.getByText("Docs Explorer")).toBeInTheDocument();
  });

  it("renders spaces page", async () => {
    navigationMock.pathname = "/docs/spaces";
    renderWithQuery(<SpacesPage />);

    expect(screen.getByRole("heading", { name: "Spaces" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Engineering")).toBeInTheDocument());
    expect(screen.getByText("Page Count")).toBeInTheDocument();
  });

  it("renders space detail", async () => {
    navigationMock.pathname = "/docs/spaces/1";
    navigationMock.params = { id: "1" };
    renderWithQuery(<SpaceDetailPage />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "Engineering" })).toBeInTheDocument());
    expect(screen.getByText("Pages in this space")).toBeInTheDocument();
    expect(screen.getAllByText("Frontend Child Notes").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Docs breadcrumbs")).toBeInTheDocument();
  });

  it("renders pages page", async () => {
    navigationMock.pathname = "/docs/pages";
    renderWithQuery(<PagesPage />);

    expect(screen.getByRole("heading", { name: "Pages" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Search pages")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Frontend Notes")).toBeInTheDocument());
  });

  it("renders page detail with mock data", async () => {
    navigationMock.pathname = "/docs/pages/5";
    navigationMock.params = { id: "5" };
    renderWithQuery(<PageDetail />);

    await waitFor(() => expect(screen.getAllByText("Docs page content").length).toBeGreaterThan(0));
    expect(screen.getByText("Helpful page")).toBeInTheDocument();
    expect(screen.getByText("Linked Work Items")).toBeInTheDocument();
    expect(screen.getByText("Related Ideas")).toBeInTheDocument();
    expect(screen.getByText("Linked Releases")).toBeInTheDocument();
    expect(screen.getByText("Link Flow Work Item")).toBeInTheDocument();
    expect(screen.getByText("Publish")).toBeInTheDocument();
    expect(screen.getByText("Version 1: Frontend Notes")).toBeInTheDocument();
  });

  it("renders docs link work draft action", async () => {
    navigationMock.pathname = "/docs/pages/5";
    navigationMock.params = { id: "5" };
    renderWithQuery(<PageDetail />);

    await waitFor(() => expect(screen.getByText("Link Flow Work Item")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Link Flow Work Item"));
    expect(screen.getByText("Create Flow Work From Page")).toBeInTheDocument();
    expect(screen.getByText(/supported_types/)).toBeInTheDocument();
    expect(screen.getAllByText("Create Story").length).toBeGreaterThan(0);
  });

  it("renders favorites page", () => {
    navigationMock.pathname = "/docs/favorites";
    renderWithQuery(<DocsFavoritesPage />);

    expect(screen.getByRole("heading", { name: "Favorite Pages" })).toBeInTheDocument();
    expect(screen.getByText("Frontend Notes")).toBeInTheDocument();
  });

  it("renders recent pages", () => {
    navigationMock.pathname = "/docs/recent";
    renderWithQuery(<DocsRecentPage />);

    expect(screen.getByRole("heading", { name: "Recent Pages" })).toBeInTheDocument();
    expect(screen.getByText("Frontend Notes")).toBeInTheDocument();
  });

  it("renders docs search", async () => {
    navigationMock.pathname = "/docs/search";
    renderWithQuery(<DocsSearchPage />);

    expect(screen.getByRole("heading", { name: "Docs Search" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search docs")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Pages").length).toBeGreaterThan(0));
  });
});
