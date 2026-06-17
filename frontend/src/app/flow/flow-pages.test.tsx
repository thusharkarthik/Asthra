import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FlowPage from "@/app/flow/page";
import BacklogPage from "@/app/flow/backlog/page";
import BoardsPage from "@/app/flow/boards/page";
import FlowDependenciesPage from "@/app/flow/dependencies/page";
import MyWorkPage from "@/app/flow/my-work/page";
import FlowHierarchyPage from "@/app/flow/hierarchy/page";
import FlowReportsPage from "@/app/flow/reports/page";
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
    if (url.includes("/work-items/7/comments") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 2, work_item_id: 7, user_id: 1, content: "New comment" }), { status: 201 });
    }
    if (url.includes("/work-items/7/children")) {
      return new Response(JSON.stringify([{ id: 10, project_id: 3, parent_id: 7, item_level: "subtask", title: "Subtask A", status_id: 1, priority_id: 2 }]), { status: 200 });
    }
    if (url.includes("/work-items/7/relations") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 3, source_work_item_id: 7, target_work_item_id: 8, relation_type: "blocks", target_title: "Target item" }), { status: 201 });
    }
    if (url.includes("/work-items/7/relations") && init?.method === "GET") {
      return new Response(JSON.stringify([{ id: 3, source_work_item_id: 7, target_work_item_id: 8, relation_type: "blocks", target_title: "Target item", target_status_id: 1, target_priority_id: 2 }]), { status: 200 });
    }
    if (url.includes("/work-items/7/subtasks") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 11, project_id: 3, parent_id: 7, item_level: "subtask", title: "New subtask" }), { status: 201 });
    }
    if (url.includes("/work-items/7/comments")) {
      return new Response(JSON.stringify([{ id: 1, work_item_id: 7, user_id: 1, content: "Looks good" }]), { status: 200 });
    }
    if (url.includes("/work-items/7") && init?.method === "PATCH") {
      return new Response(JSON.stringify({ id: 7, project_id: 3, title: "Updated Flow UI", description: "Updated details", status_id: 2, priority_id: 3, effort_size: "L", risk_level: "high" }), { status: 200 });
    }
    if (url.includes("/work-items/7") && init?.method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    if (url.includes("/work-items/7")) {
      return new Response(JSON.stringify({
        id: 7,
        project_id: 3,
        title: "Build Flow UI",
        description: "Wire work items",
        item_level: "work_item",
        status_id: 1,
        priority_id: 2,
        effort_size: "M",
        effort_score: 5,
        business_value: "high",
        risk_level: "high",
        complexity: "medium",
        acceptance_criteria: "User can create and move work.",
        definition_of_done: "Tests pass.",
        parent_id: null
      }), { status: 200 });
    }
    if (url.includes("/work-items") && init?.method === "PATCH") {
      return new Response(JSON.stringify({ id: 7, project_id: 3, title: "Build Flow UI", status_id: 2, priority_id: 2 }), { status: 200 });
    }
    if (url.includes("/work-items") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 8, project_id: 3, title: "New item", status_id: 1, priority_id: 2 }), { status: 200 });
    }
    if (url.includes("/work-items")) {
      return new Response(JSON.stringify([{ id: 7, project_id: 3, title: "Build Flow UI", item_level: "work_item", status_id: 1, priority_id: 2, effort_size: "M", effort_score: 5, business_value: "high", risk_level: "high", complexity: "medium" }, { id: 8, project_id: 3, title: "Target item", item_level: "work_item", status_id: 1, priority_id: 2 }]), { status: 200 });
    }
    if (url.includes("/projects/3/hierarchy")) {
      return new Response(JSON.stringify({
        project_id: 3,
        items: [
          { id: 1, project_id: 3, item_level: "initiative", title: "Platform Initiative", status_id: 1, priority_id: 2, children: [
            { id: 2, project_id: 3, parent_id: 1, item_level: "feature", title: "Onboarding Feature", status_id: 1, priority_id: 2, children: [
              { id: 7, project_id: 3, parent_id: 2, item_level: "work_item", title: "Build Flow UI", status_id: 1, priority_id: 2, children: [
                { id: 10, project_id: 3, parent_id: 7, item_level: "subtask", title: "Subtask A", status_id: 1, priority_id: 2, children: [] }
              ] }
            ] }
          ] }
        ]
      }), { status: 200 });
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
    expect(screen.getByRole("button", { name: "Show advanced fields" })).toBeInTheDocument();
  });

  it("create dialog shows advanced work item fields", () => {
    navigationMock.pathname = "/flow/work-items";
    renderWithQuery(<WorkItemsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Work Item" }));
    fireEvent.click(screen.getByRole("button", { name: "Show advanced fields" }));

    expect(screen.getByLabelText("Effort size")).toBeInTheDocument();
    expect(screen.getByLabelText("Business value")).toBeInTheDocument();
    expect(screen.getByLabelText("Risk level")).toBeInTheDocument();
    expect(screen.getByLabelText("Complexity")).toBeInTheDocument();
    expect(screen.getByLabelText("Acceptance criteria")).toBeInTheDocument();
    expect(screen.getByLabelText("Completion checklist")).toBeInTheDocument();
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
        description: "Created through Flow UI",
        item_level: "work_item"
      });
      expect(body).not.toHaveProperty("type_id");
      expect(body).not.toHaveProperty("status_id");
      expect(body).not.toHaveProperty("priority_id");
      expect(body).not.toHaveProperty("reporter_id");
      expect(body).not.toHaveProperty("assignee_id");
    });
  });

  it("creates work item with advanced field payload", async () => {
    navigationMock.pathname = "/flow/work-items";
    renderWithQuery(<WorkItemsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Work Item" }));
    fireEvent.click(screen.getByRole("button", { name: "Show advanced fields" }));
    fireEvent.change(screen.getByLabelText("Work item title"), { target: { value: "Advanced item" } });
    fireEvent.change(screen.getByLabelText("Effort size"), { target: { value: "L" } });
    fireEvent.change(screen.getByLabelText("Effort score"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Business value"), { target: { value: "high" } });
    fireEvent.change(screen.getByLabelText("Risk level"), { target: { value: "high" } });
    fireEvent.change(screen.getByLabelText("Complexity"), { target: { value: "medium" } });
    fireEvent.change(screen.getByLabelText("Acceptance criteria"), { target: { value: "Accepted when users can finish the flow." } });
    fireEvent.change(screen.getByLabelText("Completion checklist"), { target: { value: "Tests pass." } });
    fireEvent.click(screen.getAllByRole("button", { name: "Create Work Item" }).at(-1)!);

    await waitFor(() => {
      const postCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items") && init?.method === "POST");
      expect(postCall).toBeTruthy();
      const body = JSON.parse(String(postCall?.[1]?.body));
      expect(body).toMatchObject({
        project_id: 3,
        title: "Advanced item",
        effort_size: "L",
        effort_score: 8,
        business_value: "high",
        risk_level: "high",
        complexity: "medium",
        acceptance_criteria: "Accepted when users can finish the flow.",
        definition_of_done: "Tests pass."
      });
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
    expect(screen.getAllByText("Hierarchy").length).toBeGreaterThan(0);
    expect(screen.getByText("Related Work")).toBeInTheDocument();
    expect(screen.getByText("Subtask A")).toBeInTheDocument();
    expect(screen.getAllByText("Target item").length).toBeGreaterThan(0);
    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByText("Acceptance")).toBeInTheDocument();
    expect(screen.getByText("User can create and move work.")).toBeInTheDocument();
  });

  it("edits a work item from detail", async () => {
    navigationMock.pathname = "/flow/work-items/7";
    navigationMock.params = { id: "7" };
    renderWithQuery(<WorkItemDetailPage />);

    await waitFor(() => expect(screen.getByText("Wire work items")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByDisplayValue("Build Flow UI"), { target: { value: "Updated Flow UI" } });
    fireEvent.change(screen.getByDisplayValue("Wire work items"), { target: { value: "Updated details" } });
    fireEvent.change(screen.getByDisplayValue("Todo"), { target: { value: "in_progress" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const patchCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items/7") && init?.method === "PATCH");
      expect(patchCall).toBeTruthy();
      const body = JSON.parse(String(patchCall?.[1]?.body));
      expect(body.title).toBe("Updated Flow UI");
      expect(body.status_name).toBe("in_progress");
    });
  });

  it("edits advanced fields from detail", async () => {
    navigationMock.pathname = "/flow/work-items/7";
    navigationMock.params = { id: "7" };
    renderWithQuery(<WorkItemDetailPage />);

    await waitFor(() => expect(screen.getByText("Wire work items")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByDisplayValue("M"), { target: { value: "XL" } });
    fireEvent.change(screen.getByDisplayValue("5"), { target: { value: "13" } });
    fireEvent.change(screen.getByDisplayValue("User can create and move work."), { target: { value: "Accepted after review." } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const patchCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items/7") && init?.method === "PATCH");
      expect(patchCall).toBeTruthy();
      const body = JSON.parse(String(patchCall?.[1]?.body));
      expect(body.effort_size).toBe("XL");
      expect(body.effort_score).toBe(13);
      expect(body.acceptance_criteria).toBe("Accepted after review.");
    });
  });

  it("submits comments from work item detail", async () => {
    navigationMock.pathname = "/flow/work-items/7";
    navigationMock.params = { id: "7" };
    renderWithQuery(<WorkItemDetailPage />);

    await waitFor(() => expect(screen.getByText("Looks good")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("Add a comment"), { target: { value: "New comment" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      const postCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items/7/comments") && init?.method === "POST");
      expect(postCall).toBeTruthy();
      expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({ content: "New comment", user_id: 1 });
    });
  });

  it("archives work item from detail after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    navigationMock.pathname = "/flow/work-items/7";
    navigationMock.params = { id: "7" };
    renderWithQuery(<WorkItemDetailPage />);

    await waitFor(() => expect(screen.getByText("Wire work items")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    await waitFor(() => {
      const deleteCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items/7") && init?.method === "DELETE");
      expect(deleteCall).toBeTruthy();
      expect(navigationMock.push).toHaveBeenCalledWith("/flow/work-items");
    });
  });

  it("renders board page", async () => {
    navigationMock.pathname = "/flow/boards";
    renderWithQuery(<BoardsPage />);

    expect(screen.getByRole("heading", { name: "Boards" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Todo").length).toBeGreaterThan(0));
    expect(screen.getByText("Build Flow UI")).toBeInTheDocument();
    expect(screen.getByText("Effort: M / 5")).toBeInTheDocument();
    expect(screen.getByText("High risk")).toBeInTheDocument();
  });

  it("moves a board card with status dropdown", async () => {
    navigationMock.pathname = "/flow/boards";
    renderWithQuery(<BoardsPage />);

    await waitFor(() => expect(screen.getByText("Build Flow UI")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Move Build Flow UI"), { target: { value: "review" } });

    await waitFor(() => {
      const patchCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items/7") && init?.method === "PATCH");
      expect(patchCall).toBeTruthy();
      expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({ status_name: "review" });
    });
  });

  it("renders my work page", async () => {
    navigationMock.pathname = "/flow/my-work";
    renderWithQuery(<MyWorkPage />);

    expect(screen.getByRole("heading", { name: "My Work" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Assigned Items")).toBeInTheDocument());
  });

  it("renders backlog planning fields", async () => {
    navigationMock.pathname = "/flow/backlog";
    renderWithQuery(<BacklogPage />);

    expect(screen.getByRole("heading", { name: "Backlog" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Business Value")).toBeInTheDocument());
    expect(screen.getByText("M / 5")).toBeInTheDocument();
    expect(screen.getAllByText("High").length).toBeGreaterThan(0);
  });

  it("renders report metrics for effort and risk", async () => {
    navigationMock.pathname = "/flow/reports";
    renderWithQuery(<FlowReportsPage />);

    expect(screen.getByRole("heading", { name: "Flow Reports" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("High Risk")).toBeInTheDocument());
    expect(screen.getByText("By Effort")).toBeInTheDocument();
  });

  it("renders hierarchy page and add subtask action", async () => {
    navigationMock.pathname = "/flow/hierarchy";
    renderWithQuery(<FlowHierarchyPage />);

    expect(screen.getByRole("heading", { name: "Hierarchy" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Platform Initiative")).toBeInTheDocument());
    expect(screen.getByText("Onboarding Feature")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Subtask" })).toBeInTheDocument();
  });

  it("renders dependencies page and add relation controls", async () => {
    navigationMock.pathname = "/flow/dependencies";
    renderWithQuery(<FlowDependenciesPage />);

    expect(screen.getByRole("heading", { name: "Dependencies" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Source work item")).toBeInTheDocument());
    expect(screen.getByLabelText("Relation type")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Relation" })).toBeInTheDocument();
  });
});
