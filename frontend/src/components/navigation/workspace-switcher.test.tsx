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
        { id: 11, organization_id: 1, name: "Research" }
      ],
      projects: [
        { id: 20, workspace_id: 10, name: "Frontend" },
        { id: 21, workspace_id: 10, name: "Gateway" }
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

    act(() => {
      useWorkspaceStore.setState({ selectedWorkspaceId: 10, selectedProjectId: 20 });
    });
    fireEvent.change(screen.getByLabelText("Workspace"), { target: { value: "11" } });
    expect(useWorkspaceStore.getState().selectedWorkspaceId).toBe(11);
    expect(useWorkspaceStore.getState().selectedProjectId).toBeNull();

    act(() => {
      useWorkspaceStore.setState({ selectedProjectId: 20 });
    });
    fireEvent.change(screen.getByLabelText("Project"), { target: { value: "21" } });
    expect(useWorkspaceStore.getState().selectedProjectId).toBe(21);
  });
});
