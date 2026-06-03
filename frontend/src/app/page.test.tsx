import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

describe("HomePage", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, isAuthenticated: false, hasHydrated: true });
    useWorkspaceStore.setState({
      organizations: [{ id: 1, name: "Asthra" }],
      workspaces: [{ id: 2, organization_id: 1, name: "Platform" }],
      projects: [{ id: 3, workspace_id: 2, name: "Frontend" }],
      selectedOrganizationId: 1,
      selectedWorkspaceId: 2,
      selectedProjectId: 3
    });
  });

  it("renders real context count cards and dashboard placeholders", () => {
    render(
      <QueryProvider>
        <HomePage />
      </QueryProvider>
    );

    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("Organizations")).toBeInTheDocument();
    expect(screen.getByText("Workspaces")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Recent Work")).toBeInTheDocument();
    expect(screen.getByText("Recent Docs")).toBeInTheDocument();
    expect(screen.getByText("AI Suggestions")).toBeInTheDocument();
  });
});
