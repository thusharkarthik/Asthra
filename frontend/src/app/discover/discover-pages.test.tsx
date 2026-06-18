import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DiscoverPage from "@/app/discover/page";
import FeatureRequestsPage from "@/app/discover/feature-requests/page";
import FeedbackPage from "@/app/discover/feedback/page";
import IdeaDetailPage from "@/app/discover/ideas/[id]/page";
import IdeasPage from "@/app/discover/ideas/page";
import PrioritizationPage from "@/app/discover/prioritization/page";
import RoadmapPage from "@/app/discover/roadmap/page";
import ValidationPage from "@/app/discover/validation/page";
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

function mockDiscoverFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/ideas/7/mvp-plan")) {
      return new Response(JSON.stringify({ id: 1, idea_id: 7, scope: "Ship a lightweight validation MVP" }), { status: 200 });
    }
    if (url.includes("/ideas/7")) {
      return new Response(JSON.stringify({ id: 7, workspace_id: 2, project_id: 3, title: "Customer portal", description: "Let customers track requests", target_users: "Admins", status: "new", created_by_id: 1 }), { status: 200 });
    }
    if (url.includes("/ideas")) {
      return new Response(JSON.stringify([{ id: 7, workspace_id: 2, project_id: 3, title: "Customer portal", description: "Let customers track requests", target_users: "Admins", status: "new", created_by_id: 1 }]), { status: 200 });
    }
    if (url.includes("/feature-requests")) {
      return new Response(JSON.stringify([{ id: 1, workspace_id: 2, title: "Export roadmap", description: "CSV export", source: "customer", requested_by: "Taylor", status: "new" }]), { status: 200 });
    }
    if (url.includes("/feedback")) {
      return new Response(JSON.stringify([{ id: 2, workspace_id: 2, idea_id: 7, source: "interview", author: "Morgan", content: "Admins need better request tracking", sentiment: "positive" }]), { status: 200 });
    }
    if (url.includes("/roadmap-items")) {
      return new Response(JSON.stringify([{ id: 5, workspace_id: 2, title: "Portal beta", description: "Beta milestone", status: "planned", target_quarter: "Q3" }]), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  });
}

describe("Discover frontend screens", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigationMock.params = {};
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useWorkspaceStore.setState({ selectedOrganizationId: 1, selectedWorkspaceId: 2, selectedProjectId: 3 });
    mockDiscoverFetch();
  });

  it("renders Discover dashboard", async () => {
    renderWithQuery(<DiscoverPage />);

    expect(screen.getByRole("heading", { name: "Discover" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Customer portal").length).toBeGreaterThan(0));
  });

  it("renders ideas page", async () => {
    renderWithQuery(<IdeasPage />);

    expect(screen.getByRole("heading", { name: "Ideas" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Customer portal")).toBeInTheDocument());
  });

  it("renders feature requests page", async () => {
    renderWithQuery(<FeatureRequestsPage />);

    expect(screen.getByRole("heading", { name: "Feature Requests" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Export roadmap")).toBeInTheDocument());
  });

  it("renders feedback page", async () => {
    renderWithQuery(<FeedbackPage />);

    expect(screen.getByRole("heading", { name: "Feedback" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Admins need better request tracking")).toBeInTheDocument());
  });

  it("renders roadmap page", async () => {
    renderWithQuery(<RoadmapPage />);

    expect(screen.getByRole("heading", { name: "Roadmap" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Portal beta")).toBeInTheDocument());
  });

  it("renders validation page", async () => {
    renderWithQuery(<ValidationPage />);

    expect(screen.getByRole("heading", { name: "Validation" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Review idea")).toBeInTheDocument());
  });

  it("renders prioritization page", async () => {
    renderWithQuery(<PrioritizationPage />);

    expect(screen.getByRole("heading", { name: "Prioritization" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Customer portal")).toBeInTheDocument());
  });

  it("renders idea detail", async () => {
    navigationMock.params = { id: "7" };
    renderWithQuery(<IdeaDetailPage />);

    await waitFor(() => expect(screen.getByText("Let customers track requests")).toBeInTheDocument());
    expect(screen.getByText("Ship a lightweight validation MVP")).toBeInTheDocument();
  });
});
