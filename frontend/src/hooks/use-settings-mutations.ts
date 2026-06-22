"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { settingsApi, type NamedCreatePayload } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";

export function useCreateOrganizationMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NamedCreatePayload) => settingsApi.createOrganization(accessToken ?? "", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.list });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    }
  });
}

export function useUpdateOrganizationMutation(organizationId: number) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<NamedCreatePayload> & { is_active?: boolean }) => settingsApi.updateOrganization(accessToken ?? "", organizationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.list });
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(organizationId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    }
  });
}

export function useCreateWorkspaceMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NamedCreatePayload & { organization_id: number }) => settingsApi.createWorkspace(accessToken ?? "", payload),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list(payload.organization_id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    }
  });
}

export function useCreateProjectMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NamedCreatePayload & { workspace_id: number; status?: string }) => settingsApi.createProject(accessToken ?? "", payload),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(payload.workspace_id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.invitations.list });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.invitations });
      await queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.roles });
      await queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.permissions });
    }
  });
}

export function useCreateTeamMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NamedCreatePayload & { workspace_id: number }) => settingsApi.createTeam(accessToken ?? "", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.teams.list });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.teams });
    }
  });
}
