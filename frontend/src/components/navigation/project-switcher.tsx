"use client";

import { Select } from "@/components/ui/select";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function ProjectSwitcher() {
  const { projects, selectedProjectId, setSelectedProject } = useWorkspaceStore();

  if (projects.length === 0) {
    return (
      <Select aria-label="Project" disabled>
        <option>No projects</option>
      </Select>
    );
  }

  return (
    <Select aria-label="Project" value={selectedProjectId ?? ""} onChange={(event) => setSelectedProject(Number(event.target.value))}>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </Select>
  );
}
