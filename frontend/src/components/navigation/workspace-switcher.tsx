"use client";

import { Select } from "@/components/ui/select";
import { usePlatformContext } from "@/context/platformContext";

export function WorkspaceSwitcher() {
  const { workspaces: visibleWorkspaces, currentScope, setSelectedWorkspace } = usePlatformContext();

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
      value={currentScope.workspaceId ?? ""}
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
