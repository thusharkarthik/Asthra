"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { coreApi } from "@/services/api/core-api";
import { projectApi } from "@/services/api/project-api";
import { workspaceApi } from "@/services/api/workspace-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function useWorkspaceContextQueries() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const {
    selectedOrganizationId,
    selectedWorkspaceId,
    setOrganizations,
    setWorkspaces,
    setProjects
  } = useWorkspaceStore();

  const organizationsQuery = useQuery({
    queryKey: ["core", "organizations"],
    queryFn: () => coreApi.listOrganizations(accessToken ?? ""),
    enabled: Boolean(accessToken),
    retry: 1
  });

  useEffect(() => {
    if (organizationsQuery.data) {
      setOrganizations(organizationsQuery.data);
    }
  }, [organizationsQuery.data, setOrganizations]);

  const workspacesQuery = useQuery({
    queryKey: ["core", "workspaces", selectedOrganizationId],
    queryFn: () => workspaceApi.listWorkspaces(accessToken ?? "", selectedOrganizationId),
    enabled: Boolean(accessToken) && Boolean(selectedOrganizationId),
    retry: 1
  });

  useEffect(() => {
    if (workspacesQuery.data) {
      setWorkspaces(workspacesQuery.data);
    }
  }, [setWorkspaces, workspacesQuery.data]);

  const projectsQuery = useQuery({
    queryKey: ["core", "projects", selectedWorkspaceId],
    queryFn: () => projectApi.listProjects(accessToken ?? "", selectedWorkspaceId),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  useEffect(() => {
    if (projectsQuery.data) {
      setProjects(projectsQuery.data);
    }
  }, [projectsQuery.data, setProjects]);

  return {
    organizationsQuery,
    workspacesQuery,
    projectsQuery,
    isLoading: organizationsQuery.isLoading || workspacesQuery.isLoading || projectsQuery.isLoading,
    error: organizationsQuery.error ?? workspacesQuery.error ?? projectsQuery.error
  };
}
