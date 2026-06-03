"use client";

import { Select } from "@/components/ui/select";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();

  return (
    <Select aria-label="Workspace" value={activeWorkspaceId} onChange={(event) => setActiveWorkspace(event.target.value)}>
      {workspaces.map((workspace) => (
        <option key={workspace.id} value={workspace.id}>
          {workspace.name}
        </option>
      ))}
    </Select>
  );
}
