import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { OrganizationSwitcher } from "@/components/navigation/organization-switcher";
import { ProjectSwitcher } from "@/components/navigation/project-switcher";
import { WorkspaceSwitcher } from "@/components/navigation/workspace-switcher";
import { useWorkspaceStore } from "@/stores/workspace-store";

describe("workspace context selectors", () => {
  beforeEach(() => {
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
      <div>
        <OrganizationSwitcher />
        <WorkspaceSwitcher />
        <ProjectSwitcher />
      </div>
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
