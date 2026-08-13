import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useContextVersion } from "@/hooks/use-context-version";
import { QueryProvider } from "@/providers/query-provider";
import { coreApi } from "@/services/api/core-api";
import { useAuthStore } from "@/stores/auth-store";
import { useContextVersionStore } from "@/stores/context-version-store";

vi.mock("@/services/api/core-api", () => ({
  coreApi: {
    getContextVersion: vi.fn()
  }
}));

const invalidateSpy = vi.fn();
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: invalidateSpy,
      removeQueries: vi.fn()
    })
  };
});

function VersionProbe() {
  const query = useContextVersion({ organizationId: 1, workspaceId: 2, projectId: 3 });
  return <div>match:{String(query.versionsMatch)}</div>;
}

function renderProbe() {
  return render(
    <QueryProvider>
      <VersionProbe />
    </QueryProvider>
  );
}

describe("useContextVersion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateSpy.mockClear();
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "admin@example.com", full_name: "Admin", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useContextVersionStore.setState({ snapshot: null });
  });

  it("keeps cached context when versions match", async () => {
    const snapshot = {
      user_id: 1,
      organization_id: 1,
      organization_version: 1,
      workspace_id: 2,
      workspace_version: 1,
      project_id: 3,
      project_version: 1,
      access_version: 1,
      generated_at: "2026-06-22T00:00:00Z"
    };
    useContextVersionStore.setState({ snapshot });
    vi.mocked(coreApi.getContextVersion).mockResolvedValue(snapshot);

    renderProbe();

    await waitFor(() => expect(coreApi.getContextVersion).toHaveBeenCalled());
    await waitFor(() => expect(invalidateSpy).not.toHaveBeenCalled());
  });

  it("invalidates scoped queries when organization, workspace, project, and access versions change", async () => {
    useContextVersionStore.setState({
      snapshot: {
        user_id: 1,
        organization_id: 1,
        organization_version: 1,
        workspace_id: 2,
        workspace_version: 1,
        project_id: 3,
        project_version: 1,
        access_version: 1,
        generated_at: "2026-06-22T00:00:00Z"
      }
    });
    vi.mocked(coreApi.getContextVersion).mockResolvedValue({
      user_id: 1,
      organization_id: 1,
      organization_version: 2,
      workspace_id: 2,
      workspace_version: 3,
      project_id: 3,
      project_version: 4,
      access_version: 5,
      generated_at: "2026-06-22T00:00:01Z"
    });

    renderProbe();

    await waitFor(() => expect(coreApi.getContextVersion).toHaveBeenCalled());
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
    const invalidatedKeys = invalidateSpy.mock.calls.map(([arg]) => arg.queryKey.join(":"));
    expect(invalidatedKeys).toContain("organizations");
    expect(invalidatedKeys).toContain("workspaces:list:1");
    expect(invalidatedKeys).toContain("projects:list:2");
    expect(invalidatedKeys).toContain("permissions:current:1:2:3");
  });
});
