import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DiscoverPage from "@/app/discover/page";
import DiscoverDeliveryPage from "@/app/discover/delivery/page";
import FeatureRequestsPage from "@/app/discover/feature-requests/page";
import FeedbackPage from "@/app/discover/feedback/page";
import IdeaDetailPage from "@/app/discover/ideas/[id]/page";
import IdeasPage from "@/app/discover/ideas/page";
import PrioritizationPage from "@/app/discover/prioritization/page";
import RoadmapPage from "@/app/discover/roadmap/page";
import ValidationPage from "@/app/discover/validation/page";
import { QueryProvider } from "@/providers/query-provider";
import { PlatformContextProvider } from "@/context/platformContext";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const navigationMock = (
  globalThis as typeof globalThis & {
    __asthraNavigationMock: { pathname: string; params: Record<string, string>; push: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> };
  }
).__asthraNavigationMock;

function renderWithQuery(ui: React.ReactNode) {
  return render(<QueryProvider><PlatformContextProvider>{ui}</PlatformContextProvider></QueryProvider>);
}

function mockDiscoverFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/api/core/api/v1/auth/me")) {
      return new Response(JSON.stringify({ id: 1, email: "user@example.com", full_name: "Test User", is_active: true }), { status: 200 });
    }
    if (url.includes("/api/core/api/v1/me/permissions")) {
      return new Response(JSON.stringify({ permission_codes: ["discover.idea.create"], roles: [], scope: { scope_type: "workspace", scope_id: 2 } }), { status: 200 });
    }
    if (url.includes("/api/core/api/v1/organizations")) {
      return new Response(JSON.stringify([{ id: 1, name: "Acme", is_active: true }]), { status: 200 });
    }
    if (url.includes("/api/core/api/v1/workspaces")) {
      return new Response(JSON.stringify([{ id: 2, organization_id: 1, name: "Workspace", is_active: true }]), { status: 200 });
    }
    if (url.includes("/api/core/api/v1/projects")) {
      return new Response(JSON.stringify([{ id: 3, workspace_id: 2, name: "Frontend", status: "active", is_active: true }]), { status: 200 });
    }
    if (url.includes("/dashboard/summary")) {
      return new Response(JSON.stringify({ workspace_id: 2, total_ideas: 14, reviewing: 3, validating: 2, approved: 5, rejected: 1, converted_to_work: 4 }), { status: 200 });
    }
    if (url.includes("/ideas/7/mvp-plan")) {
      return new Response(JSON.stringify({ id: 1, idea_id: 7, scope: "Ship a lightweight validation MVP" }), { status: 200 });
    }
    if (url.includes("/ideas/7/execution-links")) {
      return new Response(JSON.stringify({
        idea_id: 7,
        documents: [{ id: 1, source_type: "idea", source_id: 7, docs_page_id: 5, title: "Customer portal Specification", status: "draft" }],
        flow_work: [{ id: 2, idea_id: 7, flow_work_item_id: 9, flow_item_type: "epic", title: "Customer portal", status: "1" }]
      }), { status: 200 });
    }
    if (url.includes("/delivery/pipeline")) {
      return new Response(JSON.stringify({
        ideas: [{ id: 7, title: "Customer portal", status: "captured" }],
        specifications: [{ id: 5, source_id: 7, title: "Customer portal Specification", status: "draft" }],
        epics: [{ id: 9, idea_id: 7, title: "Customer portal", status: "1", type: "epic" }],
        stories: [],
        tasks: [],
        completed: [],
        counts: { ideas: 1, specifications: 1, epics: 1, stories: 0, tasks: 0, completed: 0 }
      }), { status: 200 });
    }
    if (url.includes("/api/docs/api/v1/spaces")) {
      return new Response(JSON.stringify([{ id: 1, workspace_id: 2, name: "Product Specs" }]), { status: 200 });
    }
    if (url.includes("/ideas/7")) {
      return new Response(JSON.stringify({ id: 7, workspace_id: 2, project_id: 3, title: "Customer portal", description: "Let customers track requests", target_users: "Admins", business_value: "Reduce support load", impact_score: 8, confidence_score: 7, effort_score: 4, status: "captured", created_by_id: 1 }), { status: 200 });
    }
    if (url.includes("/ideas")) {
      return new Response(JSON.stringify([
        { id: 7, workspace_id: 2, project_id: 3, title: "Customer portal", description: "Let customers track requests", target_users: "Admins", business_value: "Reduce support load", impact_score: 8, confidence_score: 7, effort_score: 4, status: "captured", created_by_id: 1 },
        { id: 8, workspace_id: 2, project_id: 3, title: "Self-service billing", description: "Let admins manage billing", target_users: "Billing admins", business_value: "Reduce finance support", impact_score: 9, confidence_score: 8, effort_score: 5, status: "approved", created_by_id: 1 }
      ]), { status: 200 });
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
    if (url.includes("/api/docs/api/v1/pages")) {
      return new Response(JSON.stringify([{ id: 5, space_id: 1, title: "Customer portal requirements", content: "Customer portal requirements", status: "published" }]), { status: 200 });
    }
    if (url.includes("/api/flow/api/v1/work-items")) {
      return new Response(JSON.stringify([{ id: 9, project_id: 3, title: "Customer portal story", description: "Build customer portal", sprint_id: 4, release_id: 6 }]), { status: 200 });
    }
    if (url.includes("/api/flow/api/v1/sprints")) {
      return new Response(JSON.stringify([{ id: 4, project_id: 3, name: "Sprint 1", status: "active" }]), { status: 200 });
    }
    if (url.includes("/api/flow/api/v1/releases")) {
      return new Response(JSON.stringify([{ id: 6, project_id: 3, name: "v1.0", status: "planned" }]), { status: 200 });
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
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("renders ideas page", async () => {
    renderWithQuery(<IdeasPage />);

    expect(screen.getByRole("heading", { name: "Ideas" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Customer portal")).toBeInTheDocument());
  });

  it("opens create idea dialog with product discovery fields", async () => {
    renderWithQuery(<IdeasPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Idea" }));
    expect(await screen.findByLabelText("Idea title")).toBeInTheDocument();
    expect(screen.getByLabelText("Business value")).toBeInTheDocument();
    expect(screen.getByLabelText("Impact score")).toBeInTheDocument();
    expect(screen.getByLabelText("Confidence score")).toBeInTheDocument();
    expect(screen.getByLabelText("Effort score")).toBeInTheDocument();
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
    expect(screen.getByText("Now")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("Later")).toBeInTheDocument();
    expect(screen.getAllByText("Self-service billing").length).toBeGreaterThan(0);
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
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
    expect(screen.getAllByText("Create Epic").length).toBeGreaterThan(0);
    expect(screen.getByText("Reduce support load")).toBeInTheDocument();
  });

  it("renders idea create epic action", async () => {
    navigationMock.params = { id: "7" };
    renderWithQuery(<IdeaDetailPage />);

    await waitFor(() => expect(screen.getAllByText("Create Epic").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText("Create Epic")[1]);
    expect(screen.getAllByText("Create Epic").length).toBeGreaterThan(0);
    expect(screen.getByText(/This creates a real Flow epic/)).toBeInTheDocument();
  });

  it("renders idea conversion wizard", async () => {
    navigationMock.params = { id: "7" };
    renderWithQuery(<IdeaDetailPage />);

    await waitFor(() => expect(screen.getByText("Convert Idea")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Convert Idea"));
    expect(screen.getByText("Convert Idea - Step 1 of 4")).toBeInTheDocument();
    expect(screen.getByText("Requirements document draft")).toBeInTheDocument();
  });

  it("renders delivery lifecycle view", async () => {
    renderWithQuery(<DiscoverDeliveryPage />);

    expect(screen.getByRole("heading", { name: "Delivery View" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Customer portal Specification")).toBeInTheDocument());
    expect(screen.getByText("Specifications")).toBeInTheDocument();
    expect(screen.getByText("Epics")).toBeInTheDocument();
    expect(screen.getByText("Stories")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
  });
});
