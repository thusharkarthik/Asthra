import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCan, useClearContextCache, useSmartContextCache } from "@/hooks/use-smart-context-cache";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

vi.mock("@/services/api/core-api", () => ({
  coreApi: {
    currentUser: vi.fn(async () => ({ id: 1, email: "admin@example.com", full_name: "Admin", is_active: true })),
    listOrganizations: vi.fn(async () => [{ id: 1, name: "Asthra Labs", is_active: true }])
  }
}));

vi.mock("@/services/api/workspace-api", () => ({
  workspaceApi: {
    listWorkspaces: vi.fn(async () => [
      { id: 2, organization_id: 1, name: "Engineering", is_active: true }
    ])
  }
}));

vi.mock("@/services/api/project-api", () => ({
  projectApi: {
    listProjects: vi.fn(async () => [
      { id: 3, workspace_id: 2, name: "Asthra Platform", status: "active" }
    ])
  }
}));

vi.mock("@/services/api/settings-api", () => ({
  settingsApi: {
    getCurrentPermissions: vi.fn(async () => ({
      permission_codes: ["settings.member.invite", "flow.work_item.create"],
      roles: [{ id: 1, name: "Workspace Admin", key: "workspace_admin", scope: "workspace", source_scope_type: "workspace", source_scope_id: 2 }],
      scope: { scope_type: "workspace", scope_id: 2 }
    }))
  }
}));

function renderWithQuery(ui: React.ReactNode) {
  return render(<QueryProvider>{ui}</QueryProvider>);
}

function ContextProbe() {
  const cache = useSmartContextCache();
  const canInvite = useCan("settings.member.invite");
  return (
    <div>
      <div>org:{cache.scope.organization?.name ?? "none"}</div>
      <div>workspace:{cache.scope.workspace?.name ?? "none"}</div>
      <div>project:{cache.scope.project?.name ?? "none"}</div>
      <div>canInvite:{String(canInvite)}</div>
    </div>
  );
}

function ClearProbe() {
  const clear = useClearContextCache();
  return <button type="button" onClick={clear}>Clear context</button>;
}

describe("smart context cache", () => {
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

  it("loads current context once and exposes cached permissions", async () => {
    renderWithQuery(<ContextProbe />);

    await waitFor(() => expect(screen.getByText("org:Asthra Labs")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("workspace:Engineering")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("project:Asthra Platform")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("canInvite:true")).toBeInTheDocument());
  });

  it("clears selected context cache on logout/cache clear", async () => {
    useWorkspaceStore.setState({
      organizations: [{ id: 1, name: "Asthra Labs" }],
      workspaces: [{ id: 2, organization_id: 1, name: "Engineering" }],
      projects: [{ id: 3, workspace_id: 2, name: "Asthra Platform" }],
      selectedOrganizationId: 1,
      selectedWorkspaceId: 2,
      selectedProjectId: 3
    });
    renderWithQuery(<ClearProbe />);

    fireEvent.click(screen.getByRole("button", { name: "Clear context" }));
    expect(useWorkspaceStore.getState().selectedOrganizationId).toBeNull();
    expect(useWorkspaceStore.getState().selectedWorkspaceId).toBeNull();
    expect(useWorkspaceStore.getState().selectedProjectId).toBeNull();
  });
});
