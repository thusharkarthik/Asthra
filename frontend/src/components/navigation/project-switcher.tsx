"use client";

import { Select } from "@/components/ui/select";
import { usePlatformContext } from "@/context/platformContext";

export function ProjectSwitcher() {
  const { projects: visibleProjects, currentScope, setSelectedProject } = usePlatformContext();

  if (visibleProjects.length === 0) {
    return (
      <Select aria-label="Project" disabled>
        <option>No projects</option>
      </Select>
    );
  }

  return (
    <Select aria-label="Project" value={currentScope.projectId ?? ""} onChange={(event) => setSelectedProject(Number(event.target.value))}>
      {visibleProjects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </Select>
  );
}
