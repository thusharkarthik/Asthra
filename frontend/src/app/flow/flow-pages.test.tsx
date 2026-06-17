import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FlowPage from "@/app/flow/page";
import BacklogPage from "@/app/flow/backlog/page";
import BoardsPage from "@/app/flow/boards/page";
import FlowCapacityPage from "@/app/flow/capacity/page";
import FlowDependenciesPage from "@/app/flow/dependencies/page";
import MyWorkPage from "@/app/flow/my-work/page";
import FlowHierarchyPage from "@/app/flow/hierarchy/page";
import FlowReportsPage from "@/app/flow/reports/page";
import FlowReleaseDetailPage from "@/app/flow/releases/[id]/page";
import FlowReleasesPage from "@/app/flow/releases/page";
import FlowRoadmapPage from "@/app/flow/roadmap/page";
import FlowWorkflowSettingsPage from "@/app/flow/settings/workflows/page";
import FlowSprintDetailPage from "@/app/flow/sprints/[id]/page";
import FlowSprintsPage from "@/app/flow/sprints/page";
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
    const workflowPayload = {
      id: 20,
      project_id: 3,
      name: "Custom Workflow",
      is_default: true,
      statuses: [
        { id: 1, workflow_id: 20, name: "Backlog", key: "backlog", category: "backlog", sort_order: 0, is_active: true },
        { id: 2, workflow_id: 20, name: "Development", key: "development", category: "active", sort_order: 1, is_active: true },
        { id: 3, workflow_id: 20, name: "QA", key: "qa", category: "review", sort_order: 2, is_active: true },
        { id: 4, workflow_id: 20, name: "Done", key: "done", category: "completed", sort_order: 3, is_active: true }
      ],
      transitions: [
        { id: 1, workflow_id: 20, from_status_id: 1, to_status_id: 2, from_status_name: "Backlog", to_status_name: "Development" },
        { id: 2, workflow_id: 20, from_status_id: 2, to_status_id: 3, from_status_name: "Development", to_status_name: "QA" },
        { id: 3, workflow_id: 20, from_status_id: 3, to_status_id: 4, from_status_name: "QA", to_status_name: "Done" }
      ]
    };
    if (url.includes("/projects/3/workflow")) {
      return new Response(JSON.stringify(workflowPayload), { status: 200 });
    }
    if (url.includes("/workflows/20/statuses") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 5, workflow_id: 20, name: "Blocked", key: "blocked", category: "active", sort_order: 4, is_active: true }), { status: 201 });
    }
    if (url.includes("/workflows/20/transitions") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 4, workflow_id: 20, from_status_id: 2, to_status_id: 5, from_status_name: "Development", to_status_name: "Blocked" }), { status: 201 });
    }
    if (url.includes("/workflows/templates/engineering") && init?.method === "POST") {
      return new Response(JSON.stringify(workflowPayload), { status: 201 });
    }
    if (url.includes("/workflows/20") && init?.method === "PATCH") {
      return new Response(JSON.stringify({ ...workflowPayload, name: "Renamed Workflow" }), { status: 200 });
    }
    if (url.includes("/workflows/20") && init?.method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    if (url.includes("/workflows") && init?.method === "POST") {
      return new Response(JSON.stringify({ ...workflowPayload, id: 21, name: "New Workflow" }), { status: 201 });
    }
    if (url.includes("/workflows")) {
      return new Response(JSON.stringify([workflowPayload]), { status: 200 });
    }
    const sprintPayload = { id: 30, project_id: 3, name: "Sprint 1", goal: "Ship planning", status: "active", planned_work_count: 2, completed_work_count: 1, total_effort: 8, start_date: "2026-01-01T00:00:00Z", end_date: "2026-01-14T00:00:00Z" };
    if (url.includes("/sprints/30/start") && init?.method === "POST") {
      return new Response(JSON.stringify({ ...sprintPayload, status: "active" }), { status: 200 });
    }
    if (url.includes("/sprints/30/complete") && init?.method === "POST") {
      return new Response(JSON.stringify({ ...sprintPayload, status: "completed" }), { status: 200 });
    }
    if (url.includes("/sprints/30/work-items") && init?.method === "POST") {
      return new Response(JSON.stringify(sprintPayload), { status: 200 });
    }
    if (url.includes("/sprints/30")) {
      return new Response(JSON.stringify(sprintPayload), { status: 200 });
    }
    if (url.includes("/sprints") && init?.method === "POST") {
      return new Response(JSON.stringify({ ...sprintPayload, id: 31, name: "Sprint 2", status: "planned", planned_work_count: 0, completed_work_count: 0, total_effort: 0 }), { status: 201 });
    }
    if (url.includes("/sprints")) {
      return new Response(JSON.stringify([sprintPayload, { ...sprintPayload, id: 31, name: "Sprint 2", status: "planned", planned_work_count: 0, completed_work_count: 0, total_effort: 0 }]), { status: 200 });
    }
    const releasePayload = { id: 40, project_id: 3, name: "Release 1", version: "v1.0.0", description: "First release", target_date: "2026-02-01T00:00:00Z", actual_release_date: null, status: "active", work_item_count: 2, completed_work_count: 1, completion_percentage: 50 };
    const plannedReleasePayload = { ...releasePayload, id: 41, name: "Release 2", version: "v1.1.0", status: "planned", work_item_count: 0, completed_work_count: 0, completion_percentage: 0 };
    if (url.includes("/releases/40/activate") && init?.method === "POST") {
      return new Response(JSON.stringify({ ...releasePayload, status: "active" }), { status: 200 });
    }
    if (url.includes("/releases/40/release") && init?.method === "POST") {
      return new Response(JSON.stringify({ ...releasePayload, status: "released", actual_release_date: "2026-02-02T00:00:00Z", completion_percentage: 100 }), { status: 200 });
    }
    if (url.includes("/releases/41/work-items") && init?.method === "POST") {
      return new Response(JSON.stringify({ ...plannedReleasePayload, work_item_count: 1 }), { status: 200 });
    }
    if (url.includes("/releases/40/work-items") && init?.method === "POST") {
      return new Response(JSON.stringify(releasePayload), { status: 200 });
    }
    if (url.includes("/releases/40")) {
      return new Response(JSON.stringify(releasePayload), { status: 200 });
    }
    if (url.includes("/releases") && init?.method === "POST") {
      return new Response(JSON.stringify({ ...plannedReleasePayload, id: 42, name: "Release 3", version: "v2.0.0" }), { status: 201 });
    }
    if (url.includes("/releases")) {
      return new Response(JSON.stringify([releasePayload, plannedReleasePayload]), { status: 200 });
    }
    if (url.includes("/work-items/7/comments") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 2, work_item_id: 7, user_id: 1, content: "New comment" }), { status: 201 });
    }
    if (url.includes("/work-items/7/work-logs") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 12, work_item_id: 7, user_id: 1, description: "Implementation", time_spent_minutes: 45, logged_at: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z" }), { status: 201 });
    }
    if (url.includes("/work-items/7/work-logs/12") && init?.method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    if (url.includes("/work-items/7/work-logs") && init?.method === "GET") {
      return new Response(JSON.stringify([{ id: 12, work_item_id: 7, user_id: 1, description: "Implementation", time_spent_minutes: 45, logged_at: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z" }]), { status: 200 });
    }
    if (url.includes("/work-items/7/children")) {
      return new Response(JSON.stringify([{ id: 10, project_id: 3, parent_id: 7, item_level: "subtask", title: "Subtask A", status_id: 1, priority_id: 2 }]), { status: 200 });
    }
    if (url.includes("/work-items/7/attachments") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 4, work_item_id: 7, file_name: "design.pdf", file_url: "/tmp/design.pdf", file_type: "application/pdf", file_size: 2048, uploaded_at: "2026-01-01T00:00:00Z" }), { status: 201 });
    }
    if (url.includes("/work-items/7/attachments") && init?.method === "GET") {
      return new Response(JSON.stringify([{ id: 4, work_item_id: 7, file_name: "design.pdf", file_url: "/tmp/design.pdf", file_type: "application/pdf", file_size: 2048, uploaded_at: "2026-01-01T00:00:00Z" }]), { status: 200 });
    }
    if (url.includes("/work-items/8/attachments") || url.includes("/work-items/8/comments") || url.includes("/work-items/8/relations") || url.includes("/work-items/8/work-logs")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.includes("/work-items/7/relations") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 3, source_work_item_id: 7, target_work_item_id: 8, relation_type: "blocks", target_title: "Target item" }), { status: 201 });
    }
    if (url.includes("/work-items/7/relations") && init?.method === "GET") {
      return new Response(JSON.stringify([{ id: 3, source_work_item_id: 7, target_work_item_id: 8, relation_type: "blocks", target_title: "Target item", target_status_id: 1, target_priority_id: 2 }]), { status: 200 });
    }
    if (url.includes("/work-items/7/links") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 5, work_item_id: 7, entity_type: "desk_ticket", entity_id: "42", entity_title: "Support ticket" }), { status: 201 });
    }
    if (url.includes("/work-items/7/links/5") && init?.method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    if (url.includes("/work-items/7/links") && init?.method === "GET") {
      return new Response(JSON.stringify([
        { id: 5, work_item_id: 7, entity_type: "doc_page", entity_id: "page-1", entity_title: "Architecture Notes" },
        { id: 2, work_item_id: 7, entity_type: "discover_idea", entity_id: "idea-2", entity_title: "Onboarding Idea" },
        { id: 3, work_item_id: 7, entity_type: "pulse_incident", entity_id: "inc-3", entity_title: "Login outage" }
      ]), { status: 200 });
    }
    if (url.includes("/work-items/8/links")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.includes("/work-items/7/subtasks") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 11, project_id: 3, parent_id: 7, item_level: "subtask", title: "New subtask" }), { status: 201 });
    }
    if (url.includes("/work-items/7/comments")) {
      return new Response(JSON.stringify([{ id: 1, work_item_id: 7, user_id: 1, content: "Looks good" }]), { status: 200 });
    }
    if (url.includes("/work-items/7") && init?.method === "PATCH") {
      return new Response(JSON.stringify({ id: 7, project_id: 3, title: "Updated Flow UI", description: "Updated details", status_id: 2, priority_id: 3, sprint_id: 30, release_id: 41, effort_size: "L", risk_level: "high" }), { status: 200 });
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
        sprint_id: 30,
        release_id: 40,
        effort_size: "M",
        effort_score: 5,
        original_estimate_minutes: 240,
        remaining_estimate_minutes: 120,
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
      return new Response(JSON.stringify([{ id: 7, project_id: 3, title: "Build Flow UI", item_level: "work_item", status_id: 1, priority_id: 2, sprint_id: 30, release_id: 40, effort_size: "M", effort_score: 5, original_estimate_minutes: 240, remaining_estimate_minutes: 120, business_value: "high", risk_level: "high", complexity: "medium" }, { id: 8, project_id: 3, title: "Target item", item_level: "feature", status_id: 1, priority_id: 2, original_estimate_minutes: 120, remaining_estimate_minutes: 90 }]), { status: 200 });
    }
    if (url.includes("/capacity/99") && init?.method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    if (url.includes("/capacity") && init?.method === "POST") {
      return new Response(JSON.stringify({ id: 100, project_id: 3, user_id: 2, sprint_id: 30, capacity_minutes: 480, notes: "New capacity" }), { status: 201 });
    }
    if (url.includes("/capacity")) {
      return new Response(JSON.stringify([{ id: 99, project_id: 3, user_id: 1, sprint_id: 30, capacity_minutes: 960, notes: "Two days" }]), { status: 200 });
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

  it("applies bug template content in create dialog", () => {
    navigationMock.pathname = "/flow/work-items";
    renderWithQuery(<WorkItemsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Work Item" }));
    fireEvent.change(screen.getByLabelText("Work item template"), { target: { value: "bug" } });

    expect(screen.getByDisplayValue(/Problem Summary:/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show advanced fields" }));
    expect(screen.getByDisplayValue(/Issue is reproduced/)).toBeInTheDocument();
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
    expect(screen.getAllByText("Hierarchy").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Related Work").length).toBeGreaterThan(0);
    expect(screen.getByText("Attachments")).toBeInTheDocument();
    expect(screen.getByText("design.pdf")).toBeInTheDocument();
    expect(screen.getByText("Subtask A")).toBeInTheDocument();
    expect(screen.getAllByText("Target item").length).toBeGreaterThan(0);
    expect(screen.getByText("Linked Resources")).toBeInTheDocument();
    expect(screen.getAllByText("Architecture Notes").length).toBeGreaterThan(0);
    expect(screen.getByText("Onboarding Idea")).toBeInTheDocument();
    expect(screen.getAllByText("Login outage").length).toBeGreaterThan(0);
    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByText("Acceptance")).toBeInTheDocument();
    expect(screen.getByText("Time Tracking")).toBeInTheDocument();
    expect(screen.getAllByText(/45m/).length).toBeGreaterThan(0);
    expect(screen.getByText("User can create and move work.")).toBeInTheDocument();
  });

  it("adds work log from work item detail", async () => {
    navigationMock.pathname = "/flow/work-items/7";
    navigationMock.params = { id: "7" };
    renderWithQuery(<WorkItemDetailPage />);

    await waitFor(() => expect(screen.getByText("Time Tracking")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Time spent minutes"), { target: { value: "45" } });
    fireEvent.change(screen.getByLabelText("Work log description"), { target: { value: "Implementation" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Work Log" }));

    await waitFor(() => {
      const postCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items/7/work-logs") && init?.method === "POST");
      expect(postCall).toBeTruthy();
      expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({ user_id: 1, description: "Implementation", time_spent_minutes: 45 });
    });
  });

  it("adds and removes linked resources from work item detail", async () => {
    navigationMock.pathname = "/flow/work-items/7";
    navigationMock.params = { id: "7" };
    renderWithQuery(<WorkItemDetailPage />);

    await waitFor(() => expect(screen.getByText("Linked Resources")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Link type"), { target: { value: "desk_ticket" } });
    fireEvent.change(screen.getByLabelText("Linked entity ID"), { target: { value: "42" } });
    fireEvent.change(screen.getByLabelText("Linked entity title"), { target: { value: "Support ticket" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Link" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Remove Link" })[0]);

    await waitFor(() => {
      const postCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items/7/links") && init?.method === "POST");
      const deleteCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items/7/links/5") && init?.method === "DELETE");
      expect(postCall).toBeTruthy();
      expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({ entity_type: "desk_ticket", entity_id: "42", entity_title: "Support ticket" });
      expect(deleteCall).toBeTruthy();
    });
  });

  it("edits a work item from detail", async () => {
    navigationMock.pathname = "/flow/work-items/7";
    navigationMock.params = { id: "7" };
    renderWithQuery(<WorkItemDetailPage />);

    await waitFor(() => expect(screen.getByText("Wire work items")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByDisplayValue("Build Flow UI"), { target: { value: "Updated Flow UI" } });
    fireEvent.change(screen.getByDisplayValue("Wire work items"), { target: { value: "Updated details" } });
    fireEvent.change(screen.getByDisplayValue("Backlog"), { target: { value: "development" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const patchCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items/7") && init?.method === "PATCH");
      expect(patchCall).toBeTruthy();
      const body = JSON.parse(String(patchCall?.[1]?.body));
      expect(body.title).toBe("Updated Flow UI");
      expect(body.status_name).toBe("development");
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
    await waitFor(() => expect(screen.getAllByText("Backlog").length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.getAllByText("Development").length).toBeGreaterThan(0));
    expect(screen.getAllByText("QA").length).toBeGreaterThan(0);
    expect(screen.getByText("Build Flow UI")).toBeInTheDocument();
    expect(screen.getByText("Effort: M / 5")).toBeInTheDocument();
    expect(screen.getByText("High risk")).toBeInTheDocument();
  });

  it("moves a board card with status dropdown", async () => {
    navigationMock.pathname = "/flow/boards";
    renderWithQuery(<BoardsPage />);

    await waitFor(() => expect(screen.getByText("Build Flow UI")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Move Build Flow UI"), { target: { value: "development" } });

    await waitFor(() => {
      const patchCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/work-items/7") && init?.method === "PATCH");
      expect(patchCall).toBeTruthy();
      expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({ status_name: "development" });
    });
  });

  it("renders workflow settings and status management", async () => {
    navigationMock.pathname = "/flow/settings/workflows";
    renderWithQuery(<FlowWorkflowSettingsPage />);

    expect(screen.getByRole("heading", { name: "Flow Workflows" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Custom Workflow")).toBeInTheDocument());
    expect(screen.getAllByText("Development").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Status name")).toBeInTheDocument();
    expect(screen.getByLabelText("From status")).toBeInTheDocument();
  });

  it("updates and deletes a workflow from settings", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    navigationMock.pathname = "/flow/settings/workflows";
    renderWithQuery(<FlowWorkflowSettingsPage />);

    await waitFor(() => expect(screen.getByLabelText("Edit workflow name")).toHaveValue("Custom Workflow"));
    fireEvent.change(screen.getByLabelText("Edit workflow name"), { target: { value: "Renamed Workflow" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Workflow" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Workflow" }));

    await waitFor(() => {
      const patchCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/workflows/20") && init?.method === "PATCH");
      const deleteCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/workflows/20") && init?.method === "DELETE");
      expect(patchCall).toBeTruthy();
      expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({ name: "Renamed Workflow" });
      expect(deleteCall).toBeTruthy();
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

  it("assigns a backlog item to a sprint", async () => {
    navigationMock.pathname = "/flow/backlog";
    renderWithQuery(<BacklogPage />);

    await waitFor(() => expect(screen.getByLabelText("Move Build Flow UI to sprint")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Move Build Flow UI to sprint"), { target: { value: "30" } });

    await waitFor(() => {
      const assignCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/sprints/30/work-items") && init?.method === "POST");
      expect(assignCall).toBeTruthy();
      expect(JSON.parse(String(assignCall?.[1]?.body))).toEqual({ work_item_id: 7 });
    });
  });

  it("renders sprint list and creates a sprint", async () => {
    navigationMock.pathname = "/flow/sprints";
    renderWithQuery(<FlowSprintsPage />);

    expect(screen.getByRole("heading", { name: "Sprints" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Sprint 1").length).toBeGreaterThan(0));
    fireEvent.change(screen.getByLabelText("Sprint name"), { target: { value: "Sprint 2" } });
    fireEvent.change(screen.getByLabelText("Sprint goal"), { target: { value: "Plan execution" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Sprint" }));

    await waitFor(() => {
      const createCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/sprints") && init?.method === "POST");
      expect(createCall).toBeTruthy();
      expect(JSON.parse(String(createCall?.[1]?.body)).name).toBe("Sprint 2");
    });
  });

  it("renders sprint detail metrics", async () => {
    navigationMock.pathname = "/flow/sprints/30";
    navigationMock.params = { id: "30" };
    renderWithQuery(<FlowSprintDetailPage />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "Sprint 1" })).toBeInTheDocument());
    expect(screen.getByText("Ship planning")).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getAllByText("Capacity").length).toBeGreaterThan(0);
    expect(screen.getByText("Build Flow UI")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Complete Sprint" }));
    await waitFor(() => {
      const completeCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/sprints/30/complete") && init?.method === "POST");
      expect(completeCall).toBeTruthy();
    });
  });

  it("renders capacity page and creates capacity entry", async () => {
    navigationMock.pathname = "/flow/capacity";
    renderWithQuery(<FlowCapacityPage />);

    expect(screen.getByRole("heading", { name: "Capacity" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Capacity Entries")).toBeInTheDocument());
    expect(screen.getByText("Two days")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Capacity hours"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Capacity user id"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Capacity Entry" }));

    await waitFor(() => {
      const createCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/capacity") && init?.method === "POST");
      expect(createCall).toBeTruthy();
      expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({ project_id: 3, user_id: 2, capacity_minutes: 480 });
    });
  });

  it("renders release list and creates a release", async () => {
    navigationMock.pathname = "/flow/releases";
    renderWithQuery(<FlowReleasesPage />);

    expect(screen.getByRole("heading", { name: "Releases" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Release 1").length).toBeGreaterThan(0));
    fireEvent.change(screen.getByLabelText("Release name"), { target: { value: "Release 3" } });
    fireEvent.change(screen.getByLabelText("Release version"), { target: { value: "v2.0.0" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Release" }));

    await waitFor(() => {
      const createCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/releases") && init?.method === "POST");
      expect(createCall).toBeTruthy();
      expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({ name: "Release 3", version: "v2.0.0", project_id: 3 });
    });
  });

  it("renders release detail metrics and marks release complete", async () => {
    navigationMock.pathname = "/flow/releases/40";
    navigationMock.params = { id: "40" };
    renderWithQuery(<FlowReleaseDetailPage />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "Release 1" })).toBeInTheDocument());
    expect(screen.getByText(/First release/)).toBeInTheDocument();
    expect(screen.getAllByText("Assigned Work").length).toBeGreaterThan(0);
    expect(screen.getByText("Build Flow UI")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mark Released" }));
    await waitFor(() => {
      const releaseCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/releases/40/release") && init?.method === "POST");
      expect(releaseCall).toBeTruthy();
    });
  });

  it("renders roadmap timeline", async () => {
    navigationMock.pathname = "/flow/roadmap";
    renderWithQuery(<FlowRoadmapPage />);

    expect(screen.getByRole("heading", { name: "Roadmap" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Release Timeline")).toBeInTheDocument());
    expect(screen.getByText("Release 1")).toBeInTheDocument();
    expect(screen.getAllByText("Target item").length).toBeGreaterThan(0);
  });

  it("assigns a work item to a release from detail", async () => {
    navigationMock.pathname = "/flow/work-items/7";
    navigationMock.params = { id: "7" };
    renderWithQuery(<WorkItemDetailPage />);

    await waitFor(() => expect(screen.getByLabelText("Assign release")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Assign release"), { target: { value: "41" } });

    await waitFor(() => {
      const assignCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, init]) => String(url).includes("/api/flow/api/v1/releases/41/work-items") && init?.method === "POST");
      expect(assignCall).toBeTruthy();
      expect(JSON.parse(String(assignCall?.[1]?.body))).toEqual({ work_item_id: 7 });
    });
  });

  it("renders report metrics for effort and risk", async () => {
    navigationMock.pathname = "/flow/reports";
    renderWithQuery(<FlowReportsPage />);

    expect(screen.getByRole("heading", { name: "Flow Reports" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("High Risk")).toBeInTheDocument());
    expect(screen.getByText("Capacity Summary")).toBeInTheDocument();
    expect(screen.getByText("Estimate vs Actual")).toBeInTheDocument();
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
