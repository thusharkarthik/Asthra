import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationSwitcher } from "@/components/navigation/organization-switcher";
import { ProjectSwitcher } from "@/components/navigation/project-switcher";
import { WorkspaceSwitcher } from "@/components/navigation/workspace-switcher";
import { PlatformContextProvider } from "@/context/platformContext";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

vi.mock("@/services/api/core-api", () => ({
  coreApi: {
    currentUser: vi.fn(async () => ({ id: 1, email: "admin@example.com", full_name: "Admin", is_active: true })),
    getContextVersion: vi.fn(async () => ({
      user_id: 1,
      organization_id: 1,
      organization_version: 1,
      workspace_id: 10,
      workspace_version: 1,
      project_id: 20,
      project_version: 1,
      access_version: 1,
      generated_at: "2026-06-22T00:00:00Z"
    })),
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
      { id: 11, organization_id: 1, name: "Research" },
      { id: 12, organization_id: 2, name: "Labs Workspace" }
    ].filter((workspace) => organizationId ? workspace.organization_id === organizationId : true))
  }
}));

vi.mock("@/services/api/project-api", () => ({
  projectApi: {
    listProjects: vi.fn(async (token: string, workspaceId?: number | null) => [
      { id: 20, workspace_id: 10, name: "Frontend" },
      { id: 21, workspace_id: 10, name: "Gateway" },
      { id: 22, workspace_id: 12, name: "Labs Project" }
    ].filter((project) => workspaceId ? project.workspace_id === workspaceId : true))
  }
}));

vi.mock("@/services/api/settings-api", () => ({
  settingsApi: {
    getCurrentPermissions: vi.fn(async () => ({ permission_codes: [], roles: [], scope: { scope_type: "project", scope_id: 20 } }))
  }
}));

describe("workspace context selectors", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "admin@example.com", full_name: "Admin", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useWorkspaceStore.setState({
      organizations: [
        { id: 1, name: "Asthra" },
        { id: 2, name: "Labs" }
      ],
      workspaces: [
        { id: 10, organization_id: 1, name: "Platform" },
        { id: 11, organization_id: 1, name: "Research" },
        { id: 12, organization_id: 2, name: "Labs Workspace" }
      ],
      projects: [
        { id: 20, workspace_id: 10, name: "Frontend" },
        { id: 21, workspace_id: 10, name: "Gateway" },
        { id: 22, workspace_id: 12, name: "Labs Project" }
      ],
      selectedOrganizationId: 1,
      selectedWorkspaceId: 10,
      selectedProjectId: 20
    });
  });

  it("renders and updates organization, workspace, and project selectors", () => {
    render(
      <QueryProvider>
        <PlatformContextProvider>
          <OrganizationSwitcher />
          <WorkspaceSwitcher />
          <ProjectSwitcher />
        </PlatformContextProvider>
      </QueryProvider>
    );

    fireEvent.change(screen.getByLabelText("Organization"), { target: { value: "2" } });
    expect(useWorkspaceStore.getState().selectedOrganizationId).toBe(2);
    expect(useWorkspaceStore.getState().selectedWorkspaceId).toBeNull();

    expect(screen.queryByText("Platform")).not.toBeInTheDocument();
    expect(screen.getByText("Labs Workspace")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Workspace"), { target: { value: "12" } });
    expect(useWorkspaceStore.getState().selectedWorkspaceId).toBe(12);
    expect(useWorkspaceStore.getState().selectedProjectId).toBeNull();

    expect(screen.queryByText("Frontend")).not.toBeInTheDocument();
    expect(screen.getByText("Labs Project")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Project"), { target: { value: "22" } });
    expect(useWorkspaceStore.getState().selectedProjectId).toBe(22);
  });
});
