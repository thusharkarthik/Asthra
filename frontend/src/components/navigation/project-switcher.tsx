"use client";

import { Select } from "@/components/ui/select";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function ProjectSwitcher() {
  const { projects, activeProjectId, activeWorkspaceId, setActiveProject } = useWorkspaceStore();
  const visibleProjects = projects.filter((project) => project.workspaceId === activeWorkspaceId);

  return (
    <Select aria-label="Project" value={activeProjectId} onChange={(event) => setActiveProject(event.target.value)}>
      {visibleProjects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </Select>
  );
}
