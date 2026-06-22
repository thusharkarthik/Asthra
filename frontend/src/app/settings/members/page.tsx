"use client";

import { MembersView } from "@/components/settings/settings-admin-views";
import { useCurrentScope } from "@/context/platformContext";

export default function MembersSettingsPage() {
  const { workspaceId, organizationId } = useCurrentScope();
  return <MembersView workspaceId={workspaceId ?? undefined} organizationId={workspaceId ? undefined : organizationId ?? undefined} />;
}
