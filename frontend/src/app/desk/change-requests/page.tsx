"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateChangeRequestDialog } from "@/components/desk/desk-create-dialogs";
import { DeskSetupState } from "@/components/desk/desk-setup-state";
import { DeskSubnav } from "@/components/desk/desk-subnav";
import { deskDate } from "@/components/desk/desk-utils";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { SeverityBadge } from "@/components/modules/severity-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { Button } from "@/components/ui/button";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function ChangeRequestsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [open, setOpen] = useState(false);
  const changesQuery = useQuery({ queryKey: ["desk", "change-requests", selectedWorkspaceId], queryFn: () => deskApi.listChangeRequests(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const changes = changesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Change Requests" description="Track operational changes that need review, approval, scheduling, and follow-up." actions={<Button onClick={() => setOpen(true)}>Create change request</Button>} />
      <DeskSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DeskSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : changesQuery.isLoading ? <LoadingState /> : changes.length === 0 ? <EmptyState title="No change requests yet" /> : (
        <EntityTable columns={["Title", "Status", "Risk Level", "Requested By", "Scheduled Date"]}>
          {changes.map((change) => (
            <EntityTableRow key={change.id} columns={5}>
              <span className="font-medium">{change.title}</span>
              <SLABadge value={change.status} />
              <SeverityBadge value={change.risk_level} />
              <span>{change.requested_by_id ? `User ${change.requested_by_id}` : "Unknown"}</span>
              <span className="text-muted-foreground">{deskDate(change.updated_at ?? change.created_at)}</span>
            </EntityTableRow>
          ))}
        </EntityTable>
      )}
      <CreateChangeRequestDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
