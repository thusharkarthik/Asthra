"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import { MembersView } from "@/components/settings/settings-admin-views";
import { SettingsEmptyState, SettingsLayout } from "@/components/settings/settings-components";
import { RequestAccessButton } from "@/app/settings/layout";

const PLATFORM_ADMIN_KEYS = new Set(["superuser", "platform_owner", "platform_admin"]);
const ORG_ADMIN_KEYS = new Set(["organization_owner", "organization_admin"]);
const WORKSPACE_ADMIN_KEYS = new Set(["workspace_admin", "workspace_manager"]);

export default function MembersSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isSuperuser = Boolean(currentUser?.is_superuser);

  // Shared query keys with layout so TanStack Query serves one cached result.
  const platformPermsQuery = useQuery({
    queryKey: ["members-page", "platform-permissions"],
    queryFn: () => settingsApi.getCurrentPermissions(accessToken ?? "", {}),
    enabled: Boolean(accessToken && !isSuperuser),
    staleTime: 60_000
  });

  const myAssignmentsQuery = useQuery({
    queryKey: ["members-page", "my-role-assignments", currentUser?.id],
    queryFn: () =>
      settingsApi.listRoleAssignments(accessToken ?? "", {
        user_id: currentUser?.id,
        status: "active"
      }),
    enabled: Boolean(accessToken && currentUser?.id && !isSuperuser),
    staleTime: 60_000
  });

  const rolesQuery = useQuery({
    queryKey: ["settings", "roles"],
    queryFn: () => settingsApi.listRoles(accessToken ?? ""),
    enabled: Boolean(accessToken && !isSuperuser),
    staleTime: 60_000
  });

  // Pre-compute admin role detection for the conditional hook below.
  const queriesResolved = !platformPermsQuery.isLoading && !myAssignmentsQuery.isLoading && !rolesQuery.isLoading;
  const platformRoles = platformPermsQuery.data?.roles ?? [];
  const isPlatformAdmin = platformRoles.some((r) => PLATFORM_ADMIN_KEYS.has(r.key));
  const assignments = myAssignmentsQuery.data ?? [];
  const roleById = new Map((rolesQuery.data ?? []).map((r) => [r.id, r]));

  const orgAdminAssignment = queriesResolved
    ? assignments
        .filter((a) => a.scope_type === "organization" && a.scope_id != null)
        .find((a) => { const role = roleById.get(a.role_id); return role?.key != null && ORG_ADMIN_KEYS.has(role.key); })
    : undefined;

  const wsAdminAssignment = queriesResolved
    ? assignments
        .filter((a) => a.scope_type === "workspace" && a.scope_id != null)
        .find((a) => { const role = roleById.get(a.role_id); return role?.key != null && WORKSPACE_ADMIN_KEYS.has(role.key); })
    : undefined;

  const hasAdminRole = isSuperuser || isPlatformAdmin || orgAdminAssignment != null || wsAdminAssignment != null;

  // For non-admin users: find their first org or workspace scope to check permissions.
  const firstNonAdminOrgId = (queriesResolved && !hasAdminRole)
    ? assignments.find((a) => a.scope_type === "organization" && a.scope_id != null)?.scope_id
    : undefined;
  const firstNonAdminWsId = (queriesResolved && !hasAdminRole && firstNonAdminOrgId == null)
    ? assignments.find((a) => a.scope_type === "workspace" && a.scope_id != null)?.scope_id
    : undefined;

  const memberScopeParams = firstNonAdminOrgId != null
    ? { org_id: firstNonAdminOrgId }
    : firstNonAdminWsId != null
    ? { workspace_id: firstNonAdminWsId }
    : {};

  // Fetch scoped permissions to check if the user's role grants settings.member.view.
  const memberPermQuery = useQuery({
    queryKey: ["members-page", "member-scope-perm", firstNonAdminOrgId ?? firstNonAdminWsId ?? null],
    queryFn: () => settingsApi.getCurrentPermissions(accessToken ?? "", memberScopeParams),
    enabled: Boolean(accessToken && !isSuperuser && (firstNonAdminOrgId != null || firstNonAdminWsId != null)),
    staleTime: 60_000,
  });

  if (isSuperuser) {
    return <MembersView />;
  }

  if (platformPermsQuery.isLoading || myAssignmentsQuery.isLoading || rolesQuery.isLoading) {
    return null;
  }

  if (isPlatformAdmin) {
    return <MembersView />;
  }

  if (orgAdminAssignment?.scope_id != null) {
    return <MembersView organizationId={orgAdminAssignment.scope_id} />;
  }

  if (wsAdminAssignment?.scope_id != null) {
    return <MembersView workspaceId={wsAdminAssignment.scope_id} />;
  }

  // Wait for scope-based permission check to resolve.
  if (memberPermQuery.isLoading) {
    return null;
  }

  const canViewMembers = memberPermQuery.data?.permission_codes?.includes("settings.member.view") ?? false;

  if (canViewMembers) {
    if (firstNonAdminOrgId != null) {
      return <MembersView organizationId={firstNonAdminOrgId} />;
    }
    if (firstNonAdminWsId != null) {
      return <MembersView workspaceId={firstNonAdminWsId} />;
    }
  }

  return (
    <SettingsLayout
      breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Members" }]}
      backHref="/settings"
      backLabel="Back to Settings"
    >
      <SettingsEmptyState
        title="Access Restricted"
        description="You don't have permission to view or manage members. Contact your Organization Admin to request access."
        action={<RequestAccessButton page="/settings/members" />}
      />
    </SettingsLayout>
  );
}
