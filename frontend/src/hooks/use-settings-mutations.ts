"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { settingsApi, type NamedCreatePayload } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";

async function invalidateCoreStructure(
  queryClient: ReturnType<typeof useQueryClient>,
  affected: { organizations?: boolean; workspaces?: boolean; projects?: boolean; access?: boolean }
) {
  const invalidations: Array<Promise<unknown>> = [
    queryClient.invalidateQueries({ queryKey: queryKeys.platformContext.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.context.versionRoot }),
  ];
  if (affected.organizations) invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all }));
  if (affected.workspaces) invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all }));
  if (affected.projects) invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }));
  if (affected.access) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all }));
    invalidations.push(queryClient.invalidateQueries({ queryKey: ["members-page"] }));
  }
  await Promise.all(invalidations);
}

export function useCreateOrganizationMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NamedCreatePayload) => settingsApi.createOrganization(accessToken ?? "", payload),
    onSuccess: async () => {
      await invalidateCoreStructure(queryClient, { organizations: true, workspaces: true, projects: true, access: true });
    }
  });
}

export function useUpdateOrganizationMutation(organizationId: number) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<NamedCreatePayload> & { is_active?: boolean }) => settingsApi.updateOrganization(accessToken ?? "", organizationId, payload),
    onSuccess: async () => {
      await invalidateCoreStructure(queryClient, { organizations: true });
    }
  });
}

export function useCreateWorkspaceMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NamedCreatePayload & { organization_id: number }) => settingsApi.createWorkspace(accessToken ?? "", payload),
    onSuccess: async () => {
      await invalidateCoreStructure(queryClient, { workspaces: true, projects: true });
    }
  });
}

export function useCreateProjectMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NamedCreatePayload & { workspace_id: number; status?: string }) => settingsApi.createProject(accessToken ?? "", payload),
    onSuccess: async () => {
      await invalidateCoreStructure(queryClient, { projects: true });
    }
  });
}

export function useInviteMemberMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; organization_id: number; workspace_id?: number | null; role_id?: number | null }) =>
      settingsApi.createInvitation(accessToken ?? "", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.context.versionRoot });
      await queryClient.invalidateQueries({ queryKey: queryKeys.invitations.list });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.invitations });
      await queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      await queryClient.invalidateQueries({ queryKey: ["settings", "members"] });
      await queryClient.invalidateQueries({ queryKey: ["settings", "global-member-role-assignments"] });
      // Invalidate authority queries used by settings/layout.tsx so settings unlock without page refresh.
      await queryClient.invalidateQueries({ queryKey: ["members-page"] });
      await queryClient.invalidateQueries({ queryKey: ["settings", "roles"] });
    }
  });
}

export function useAssignRoleMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { user_id: number; role_id: number; scope_type: string; scope_id?: number | null; status?: string }) =>
      settingsApi.createRoleAssignment(accessToken ?? "", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.context.versionRoot });
      await queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      await queryClient.invalidateQueries({ queryKey: ["settings", "members"] });
      await queryClient.invalidateQueries({ queryKey: ["settings", "global-member-role-assignments"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.roles });
      await queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.permissions });
      // Invalidate authority queries used by settings/layout.tsx so settings unlock without page refresh.
      await queryClient.invalidateQueries({ queryKey: ["members-page"] });
    }
  });
}

export function useCreateTeamMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NamedCreatePayload & { workspace_id: number }) => settingsApi.createTeam(accessToken ?? "", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.context.versionRoot });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.teams });
    }
  });
}
