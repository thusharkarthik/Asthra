"use client";

import { Select } from "@/components/ui/select";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function WorkspaceSwitcher() {
  const { workspaces, selectedOrganizationId, selectedWorkspaceId, setSelectedWorkspace } = useWorkspaceStore();
  const visibleWorkspaces = selectedOrganizationId
    ? workspaces.filter((workspace) => workspace.organization_id === selectedOrganizationId)
    : workspaces;

  if (visibleWorkspaces.length === 0) {
    return (
      <Select aria-label="Workspace" disabled>
        <option>No workspaces</option>
      </Select>
    );
  }

  return (
    <Select
      aria-label="Workspace"
      value={selectedWorkspaceId ?? ""}
      onChange={(event) => setSelectedWorkspace(Number(event.target.value))}
    >
      {visibleWorkspaces.map((workspace) => (
        <option key={workspace.id} value={workspace.id}>
          {workspace.name}
        </option>
      ))}
    </Select>
  );
}
