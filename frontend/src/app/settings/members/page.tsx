"use client";

import { MembersView } from "@/components/settings/settings-admin-views";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function MembersSettingsPage() {
  const workspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const organizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  return <MembersView workspaceId={workspaceId ?? undefined} organizationId={workspaceId ? undefined : organizationId ?? undefined} />;
}
