import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FlowPage from "@/app/flow/page";
import WorkItemsPage from "@/app/flow/work-items/page";
import WorkItemDetailPage from "@/app/flow/work-items/[id]/page";
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

function mockFlowFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes("/work-items/7/comments")) {
      return new Response(JSON.stringify([{ id: 1, work_item_id: 7, user_id: 1, content: "Looks good" }]), { status: 200 });
    }
    if (url.includes("/work-items/7")) {
      return new Response(JSON.stringify({ id: 7, project_id: 3, title: "Build Flow UI", description: "Wire work items", status_id: 1, priority_id: 2 }), { status: 200 });
    }
    if (url.includes("/work-items") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 8, project_id: 3, title: "New item", status_id: 1, priority_id: 2 }), { status: 200 });
    }
    if (url.includes("/work-items")) {
      return new Response(JSON.stringify([{ id: 7, project_id: 3, title: "Build Flow UI", status_id: 1, priority_id: 2 }]), { status: 200 });
    }
    if (url.includes("/boards")) {
      return new Response(JSON.stringify([{ id: 1, name: "Main board" }]), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  });
}

describe("Flow frontend screens", () => {
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
    mockFlowFetch();
  });

  it("renders Flow dashboard", async () => {
    renderWithQuery(<FlowPage />);

    expect(screen.getByRole("heading", { name: "Flow" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Build Flow UI")).toBeInTheDocument());
  });

  it("renders work items page", async () => {
    renderWithQuery(<WorkItemsPage />);

    expect(screen.getByRole("heading", { name: "Work Items" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Build Flow UI")).toBeInTheDocument());
  });

  it("renders work item create dialog", () => {
    renderWithQuery(<WorkItemsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create work item" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Work item title")).toBeInTheDocument();
  });

  it("renders work item detail with mock data", async () => {
    navigationMock.params = { id: "7" };
    renderWithQuery(<WorkItemDetailPage />);

    await waitFor(() => expect(screen.getByText("Wire work items")).toBeInTheDocument());
    expect(screen.getByText("Looks good")).toBeInTheDocument();
  });
});
