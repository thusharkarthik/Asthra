import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/providers/query-provider";
import { useOrganizations } from "@/hooks/use-platform-queries";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { coreApi } from "@/services/api/core-api";

vi.mock("@/services/api/core-api", () => ({
  coreApi: {
    currentUser: vi.fn(),
    listOrganizations: vi.fn(async () => [{ id: 1, name: "Asthra Labs", is_active: true }])
  }
}));

function OrganizationProbe({ label }: { label: string }) {
  const query = useOrganizations();
  return <div>{label}:{query.data?.[0]?.name ?? "loading"}</div>;
}

describe("platform query hooks", () => {
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

  it("shares organization cache across multiple consumers", async () => {
    render(
      <QueryProvider>
        <OrganizationProbe label="one" />
        <OrganizationProbe label="two" />
      </QueryProvider>
    );

    await waitFor(() => expect(screen.getByText("one:Asthra Labs")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("two:Asthra Labs")).toBeInTheDocument());
    expect(coreApi.listOrganizations).toHaveBeenCalledTimes(1);
  });
});
