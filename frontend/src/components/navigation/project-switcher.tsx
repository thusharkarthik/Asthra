"use client";

import { Select } from "@/components/ui/select";
import { useProjects } from "@/hooks/use-smart-context-cache";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function ProjectSwitcher() {
  const { projects: cachedProjects, selectedWorkspaceId, selectedProjectId, setSelectedProject } = useWorkspaceStore();
  const projectsQuery = useProjects(selectedWorkspaceId);
  const projects = projectsQuery.data ?? cachedProjects;
  const visibleProjects = selectedWorkspaceId
    ? projects.filter((project) => project.workspace_id === selectedWorkspaceId)
    : projects;

  if (visibleProjects.length === 0) {
    return (
      <Select aria-label="Project" disabled>
        <option>No projects</option>
      </Select>
    );
  }

  return (
    <Select aria-label="Project" value={selectedProjectId ?? ""} onChange={(event) => setSelectedProject(Number(event.target.value))}>
      {visibleProjects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </Select>
  );
}
