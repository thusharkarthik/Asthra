"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import { MemberDetailView } from "@/components/settings/settings-admin-views";
import { SettingsEmptyState, SettingsLayout } from "@/components/settings/settings-components";

const PLATFORM_ADMIN_KEYS = new Set(["superuser", "platform_owner", "platform_admin"]);
const ORG_ADMIN_KEYS = new Set(["organization_owner", "organization_admin"]);
const WORKSPACE_ADMIN_KEYS = new Set(["workspace_admin", "workspace_manager"]);

export default function MemberDetailPage() {
  const params = useParams();
  const userId = Number(params.id as string);

  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isSuperuser = Boolean(currentUser?.is_superuser);

  // Same query keys as members/page.tsx and settings/layout.tsx — one cached fetch serves all.
  const platformPermsQuery = useQuery({
    queryKey: ["members-page", "platform-permissions"],
    queryFn: () => settingsApi.getCurrentPermissions(accessToken ?? "", {}),
    enabled: Boolean(accessToken && !isSuperuser),
    staleTime: 60_000,
  });

  const myAssignmentsQuery = useQuery({
    queryKey: ["members-page", "my-role-assignments", currentUser?.id],
    queryFn: () =>
      settingsApi.listRoleAssignments(accessToken ?? "", {
        user_id: currentUser?.id,
        status: "active",
      }),
    enabled: Boolean(accessToken && currentUser?.id && !isSuperuser),
    staleTime: 60_000,
  });

  const rolesQuery = useQuery({
    queryKey: ["settings", "roles"],
    queryFn: () => settingsApi.listRoles(accessToken ?? ""),
    enabled: Boolean(accessToken && !isSuperuser),
    staleTime: 60_000,
  });

  // Superuser — always allowed.
  if (isSuperuser) {
    return <MemberDetailView userId={userId} />;
  }

  // Still resolving authority.
  if (platformPermsQuery.isLoading || myAssignmentsQuery.isLoading || rolesQuery.isLoading) {
    return null;
  }

  // Platform admin/owner — allowed.
  const platformRoles = platformPermsQuery.data?.roles ?? [];
  if (platformRoles.some((r) => PLATFORM_ADMIN_KEYS.has(r.key))) {
    return <MemberDetailView userId={userId} />;
  }

  const assignments = myAssignmentsQuery.data ?? [];
  const roleById = new Map((rolesQuery.data ?? []).map((r) => [r.id, r]));

  // Org admin/owner — allowed.
  const hasOrgAuthority = assignments
    .filter((a) => a.scope_type === "organization" && a.scope_id != null)
    .some((a) => {
      const role = roleById.get(a.role_id);
      return role != null && role.key != null && ORG_ADMIN_KEYS.has(role.key);
    });

  if (hasOrgAuthority) {
    return <MemberDetailView userId={userId} />;
  }

  // Workspace admin/manager — allowed.
  const hasWorkspaceAuthority = assignments
    .filter((a) => a.scope_type === "workspace" && a.scope_id != null)
    .some((a) => {
      const role = roleById.get(a.role_id);
      return role != null && role.key != null && WORKSPACE_ADMIN_KEYS.has(role.key);
    });

  if (hasWorkspaceAuthority) {
    return <MemberDetailView userId={userId} />;
  }

  // No authority — show restricted state, do not render member detail.
  return (
    <SettingsLayout
      breadcrumbs={[
        { label: "Settings", href: "/settings" },
        { label: "Members", href: "/settings/members" },
        { label: "Member Detail" },
      ]}
      backHref="/settings/members"
      backLabel="Back to Members"
    >
      <SettingsEmptyState
        title="Access Restricted"
        description="You don't have permission to view member details."
      />
    </SettingsLayout>
  );
}
