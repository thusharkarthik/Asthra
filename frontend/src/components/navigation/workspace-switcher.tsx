"use client";

import { Select } from "@/components/ui/select";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function WorkspaceSwitcher() {
  const { workspaces, selectedWorkspaceId, setSelectedWorkspace } = useWorkspaceStore();

  if (workspaces.length === 0) {
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
      {workspaces.map((workspace) => (
        <option key={workspace.id} value={workspace.id}>
          {workspace.name}
        </option>
      ))}
    </Select>
  );
}
