"use client";

import { Select } from "@/components/ui/select";
import { useWorkspaces } from "@/hooks/use-smart-context-cache";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function WorkspaceSwitcher() {
  const { workspaces: cachedWorkspaces, selectedOrganizationId, selectedWorkspaceId, setSelectedWorkspace } = useWorkspaceStore();
  const workspacesQuery = useWorkspaces(selectedOrganizationId);
  const workspaces = workspacesQuery.data ?? cachedWorkspaces;
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
