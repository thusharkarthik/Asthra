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

  // Platform-scope permissions tell us if the user has platform-level admin roles.
  // Called with {} so the API receives no org/workspace/project params → platform scope.
  const platformPermsQuery = useQuery({
    queryKey: ["members-page", "platform-permissions"],
    queryFn: () => settingsApi.getCurrentPermissions(accessToken ?? "", {}),
    enabled: Boolean(accessToken && !isSuperuser),
    staleTime: 60_000
  });

  // The user's own active role assignments let us detect org/workspace authority
  // when no platform-level admin role is found.
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

  // Superuser — always shows the platform-wide global directory without any queries.
  if (isSuperuser) {
    return <MembersView />;
  }

  // Still resolving authority — defer rendering until we know the right scope.
  // This prevents the global-directory queries from firing prematurely.
  if (platformPermsQuery.isLoading || myAssignmentsQuery.isLoading || rolesQuery.isLoading) {
    return null;
  }

  const platformRoles = platformPermsQuery.data?.roles ?? [];

  // Platform admin or owner → global directory.
  if (platformRoles.some((r) => PLATFORM_ADMIN_KEYS.has(r.key))) {
    return <MembersView />;
  }

  const assignments = myAssignmentsQuery.data ?? [];
  const roleById = new Map((rolesQuery.data ?? []).map((r) => [r.id, r]));

  // Highest org-level admin assignment → show that org's members.
  const orgAssignment = assignments
    .filter((a) => a.scope_type === "organization" && a.scope_id != null)
    .find((a) => {
      const role = roleById.get(a.role_id);
      return role != null && role.key != null && ORG_ADMIN_KEYS.has(role.key);
    });

  if (orgAssignment?.scope_id != null) {
    return <MembersView organizationId={orgAssignment.scope_id} />;
  }

  // Highest workspace-level admin assignment → show that workspace's members.
  const workspaceAssignment = assignments
    .filter((a) => a.scope_type === "workspace" && a.scope_id != null)
    .find((a) => {
      const role = roleById.get(a.role_id);
      return role != null && role.key != null && WORKSPACE_ADMIN_KEYS.has(role.key);
    });

  if (workspaceAssignment?.scope_id != null) {
    return <MembersView workspaceId={workspaceAssignment.scope_id} />;
  }

  // No authority role found — show restricted state. Do not call any member API.
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
