import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FlowPage from "@/app/flow/page";
import BoardsPage from "@/app/flow/boards/page";
import MyWorkPage from "@/app/flow/my-work/page";
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
    navigationMock.pathname = "/flow";
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useWorkspaceStore.setState({
      organizations: [{ id: 1, name: "Acme" }],
      workspaces: [{ id: 2, organization_id: 1, name: "Workspace" }],
      projects: [{ id: 3, workspace_id: 2, name: "Project" }],
      selectedOrganizationId: 1,
      selectedWorkspaceId: 2,
      selectedProjectId: 3
    });
    mockFlowFetch();
  });

  it("renders Flow dashboard", async () => {
    renderWithQuery(<FlowPage />);

    expect(screen.getByRole("heading", { name: "Flow" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Open Work Items")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Build Flow UI")).toBeInTheDocument());
  });

  it("renders guided empty state when no project is selected", () => {
    useWorkspaceStore.setState({
      organizations: [{ id: 1, name: "Acme" }],
      workspaces: [{ id: 2, organization_id: 1, name: "Workspace" }],
      projects: [],
      selectedOrganizationId: 1,
      selectedWorkspaceId: 2,
      selectedProjectId: null
    });

    renderWithQuery(<FlowPage />);

    expect(screen.getByText("Create or select a project for Flow")).toBeInTheDocument();
    expect(screen.getByText("Create Project")).toBeInTheDocument();
  });

  it("renders work items page", async () => {
    navigationMock.pathname = "/flow/work-items";
    renderWithQuery(<WorkItemsPage />);

    expect(screen.getByRole("heading", { name: "Work Items" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search work items")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Build Flow UI")).toBeInTheDocument());
  });

  it("renders work item create dialog", () => {
    navigationMock.pathname = "/flow/work-items";
    renderWithQuery(<WorkItemsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Work Item" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Work item title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Todo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Medium")).toBeInTheDocument();
    expect(screen.getByLabelText("Assignee id")).toHaveAttribute("placeholder", "Assignee ID, optional");
  });

  it("creates work item with selected project and minimal stable payload", async () => {
    navigationMock.pathname = "/flow/work-items";
    renderWithQuery(<WorkItemsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Work Item" }));
    fireEvent.change(screen.getByLabelText("Work item title"), { target: { value: "Create from frontend" } });
    fireEvent.change(screen.getByLabelText("Work item description"), { target: { value: "Created through Flow UI" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Create Work Item" }).at(-1)!);

    await waitFor(() => {
      const postCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items") && init?.method === "POST");
      expect(postCall).toBeTruthy();
      const body = JSON.parse(String(postCall?.[1]?.body));
      expect(body).toEqual({
        project_id: 3,
        title: "Create from frontend",
        description: "Created through Flow UI"
      });
      expect(body).not.toHaveProperty("type_id");
      expect(body).not.toHaveProperty("status_id");
      expect(body).not.toHaveProperty("priority_id");
      expect(body).not.toHaveProperty("reporter_id");
      expect(body).not.toHaveProperty("assignee_id");
    });
  });

  it("blocks work item creation when no project is selected", async () => {
    useWorkspaceStore.setState({
      organizations: [{ id: 1, name: "Acme" }],
      workspaces: [{ id: 2, organization_id: 1, name: "Workspace" }],
      projects: [{ id: 3, workspace_id: 2, name: "Project" }],
      selectedOrganizationId: 1,
      selectedWorkspaceId: 2,
      selectedProjectId: null
    });
    navigationMock.pathname = "/flow/work-items";
    renderWithQuery(<WorkItemsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Work Item" }));
    fireEvent.change(screen.getByLabelText("Work item title"), { target: { value: "Blocked item" } });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);

    await waitFor(() => expect(screen.getByText("Select a project before creating a work item.")).toBeInTheDocument());
    const postCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items") && init?.method === "POST");
    expect(postCall).toBeUndefined();
  });

  it("shows backend work item create errors", async () => {
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/work-items") && init?.method === "POST") {
        return new Response(JSON.stringify({ detail: "Work item status not found." }), { status: 404 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });
    navigationMock.pathname = "/flow/work-items";
    renderWithQuery(<WorkItemsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Work Item" }));
    fireEvent.change(screen.getByLabelText("Work item title"), { target: { value: "Create error" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Create Work Item" }).at(-1)!);

    await waitFor(() => expect(screen.getByText("Work item status not found.")).toBeInTheDocument());
  });

  it("shows backend 422 validation field details", async () => {
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/work-items") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "validation_error",
              message: "Request validation failed.",
              details: [
                { loc: ["body", "project_id"], msg: "Field required", type: "missing" },
                { loc: ["body", "title"], msg: "String should have at least 1 character", type: "string_too_short" }
              ]
            }
          }),
          { status: 422 }
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });
    navigationMock.pathname = "/flow/work-items";
    renderWithQuery(<WorkItemsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Work Item" }));
    fireEvent.change(screen.getByLabelText("Work item title"), { target: { value: "Create error" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Create Work Item" }).at(-1)!);

    await waitFor(() => expect(screen.getByText(/project_id: Field required/)).toBeInTheDocument());
    expect(screen.getByText(/title: String should have at least 1 character/)).toBeInTheDocument();
  });

  it("renders work item detail with mock data", async () => {
    navigationMock.pathname = "/flow/work-items/7";
    navigationMock.params = { id: "7" };
    renderWithQuery(<WorkItemDetailPage />);

    await waitFor(() => expect(screen.getByText("Wire work items")).toBeInTheDocument());
    expect(screen.getByText("Looks good")).toBeInTheDocument();
    expect(screen.getByText("Linked Docs")).toBeInTheDocument();
  });

  it("renders board page", async () => {
    navigationMock.pathname = "/flow/boards";
    renderWithQuery(<BoardsPage />);

    expect(screen.getByRole("heading", { name: "Boards" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Todo").length).toBeGreaterThan(0));
    expect(screen.getByText("Build Flow UI")).toBeInTheDocument();
  });

  it("renders my work page", async () => {
    navigationMock.pathname = "/flow/my-work";
    renderWithQuery(<MyWorkPage />);

    expect(screen.getByRole("heading", { name: "My Work" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Assigned Items")).toBeInTheDocument());
  });
});
