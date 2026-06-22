import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/providers/query-provider";
import { PlatformContextProvider, useCan, usePlatformContext } from "@/context/platformContext";
import { coreApi } from "@/services/api/core-api";
import { projectApi } from "@/services/api/project-api";
import { settingsApi } from "@/services/api/settings-api";
import { workspaceApi } from "@/services/api/workspace-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

vi.mock("@/services/api/core-api", () => ({
  coreApi: {
    currentUser: vi.fn(async () => ({ id: 1, email: "admin@example.com", full_name: "Admin", is_active: true })),
    listOrganizations: vi.fn(async () => [
      { id: 1, name: "Asthra" },
      { id: 2, name: "Labs" }
    ])
  }
}));

vi.mock("@/services/api/workspace-api", () => ({
  workspaceApi: {
    listWorkspaces: vi.fn(async (token: string, organizationId?: number | null) => [
      { id: 10, organization_id: 1, name: "Platform" },
      { id: 12, organization_id: 2, name: "Labs Workspace" }
    ].filter((workspace) => organizationId ? workspace.organization_id === organizationId : true))
  }
}));

vi.mock("@/services/api/project-api", () => ({
  projectApi: {
    listProjects: vi.fn(async (token: string, workspaceId?: number | null) => [
      { id: 20, workspace_id: 10, name: "Frontend" },
      { id: 22, workspace_id: 12, name: "Labs Project" }
    ].filter((project) => workspaceId ? project.workspace_id === workspaceId : true))
  }
}));

vi.mock("@/services/api/settings-api", () => ({
  settingsApi: {
    getCurrentPermissions: vi.fn(async (_token: string, params: { org_id?: number | null; workspace_id?: number | null; project_id?: number | null }) => ({
      permission_codes: params.project_id === 22 ? ["docs.page.edit"] : ["settings.member.invite"],
      roles: [],
      scope: { scope_type: "project", scope_id: params.project_id }
    }))
  }
}));

function renderWithPlatform(ui: React.ReactNode) {
  return render(
    <QueryProvider>
      <PlatformContextProvider>{ui}</PlatformContextProvider>
    </QueryProvider>
  );
}

function ContextProbe() {
  const context = usePlatformContext();
  const canInvite = useCan("settings.member.invite");
  const canEditDocs = useCan("docs.page.edit");
  return (
    <div>
      <div>org:{context.selectedOrganization?.name ?? "none"}</div>
      <div>workspace:{context.selectedWorkspace?.name ?? "none"}</div>
      <div>project:{context.selectedProject?.name ?? "none"}</div>
      <div>canInvite:{String(canInvite)}</div>
      <div>canEditDocs:{String(canEditDocs)}</div>
      <button type="button" onClick={() => context.setSelectedOrganization(2)}>Select Labs</button>
      <button type="button" onClick={() => context.setSelectedWorkspace(12)}>Select Labs Workspace</button>
      <button type="button" onClick={() => context.setSelectedProject(22)}>Select Labs Project</button>
    </div>
  );
}

describe("PlatformContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "admin@example.com", full_name: "Admin", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useWorkspaceStore.setState({
      organizations: [],
      workspaces: [],
      projects: [],
      selectedOrganizationId: null,
      selectedWorkspaceId: null,
      selectedProjectId: null
    });
  });

  it("loads context once and exposes current scope and permissions", async () => {
    renderWithPlatform(<ContextProbe />);

    await waitFor(() => expect(screen.getByText("org:Asthra")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("workspace:Platform")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("project:Frontend")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("canInvite:true")).toBeInTheDocument());
    expect(coreApi.listOrganizations).toHaveBeenCalledTimes(1);
    expect(workspaceApi.listWorkspaces).toHaveBeenCalledTimes(1);
    expect(projectApi.listProjects).toHaveBeenCalledTimes(1);
  });

  it("resets invalid child scope and refreshes permissions when scope changes", async () => {
    renderWithPlatform(<ContextProbe />);

    await waitFor(() => expect(screen.getByText("project:Frontend")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Select Labs" }));
    expect(useWorkspaceStore.getState().selectedWorkspaceId).toBeNull();
    expect(useWorkspaceStore.getState().selectedProjectId).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Select Labs Workspace" }));
    await waitFor(() => expect(screen.getByText("workspace:Labs Workspace")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Select Labs Project" }));
    await waitFor(() => expect(screen.getByText("project:Labs Project")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("canEditDocs:true")).toBeInTheDocument());
    expect(settingsApi.getCurrentPermissions).toHaveBeenCalled();
  });
});
