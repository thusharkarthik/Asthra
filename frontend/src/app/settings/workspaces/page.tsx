"use client";

import { WorkspacesView } from "@/components/settings/settings-admin-views";
import { useAuthStore } from "@/stores/auth-store";
import { usePlatformContext } from "@/context/platformContext";
import { useSettingsAuthority, RequestAccessButton } from "@/app/settings/layout";
import { SettingsEmptyState, SettingsLayout } from "@/components/settings/settings-components";
import { hasHierarchicalPermission } from "@/lib/settings-permissions";

export default function WorkspacesSettingsPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isSuperuser = Boolean(currentUser?.is_superuser);
  const { can, isLoading: ctxIsLoading } = usePlatformContext();
  const { authorityLevel } = useSettingsAuthority();

  const isAdminUser = isSuperuser || authorityLevel === "platform" || authorityLevel === "org";
  const canViewWorkspaces =
    isAdminUser ||
    hasHierarchicalPermission(can, "settings.organization.view", "settings.workspace.view");

  if (!isAdminUser && ctxIsLoading) return null;

  if (!canViewWorkspaces) {
    return (
      <SettingsLayout
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Workspaces" }]}
        backHref="/settings"
        backLabel="Back to Settings"
      >
        <SettingsEmptyState
          title="Access Restricted"
          description="You need organization view and workspace view permissions to see this page. Contact your Organization Admin to request access."
          action={<RequestAccessButton page="/settings/workspaces" />}
        />
      </SettingsLayout>
    );
  }

  return <WorkspacesView />;
}
