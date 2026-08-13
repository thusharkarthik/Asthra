"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateSlaDialog } from "@/components/desk/desk-create-dialogs";
import { DeskSetupState } from "@/components/desk/desk-setup-state";
import { DeskSubnav } from "@/components/desk/desk-subnav";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { Button } from "@/components/ui/button";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function SlasPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [open, setOpen] = useState(false);
  const slasQuery = useQuery({ queryKey: ["desk", "slas", selectedWorkspaceId], queryFn: () => deskApi.listSlas(accessToken ?? "", { workspace_id: selectedWorkspaceId }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const slas = slasQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="SLAs" description="Define response and resolution targets by priority." actions={<Button onClick={() => setOpen(true)}>Add SLA</Button>} />
      <DeskSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DeskSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : slasQuery.isLoading ? <LoadingState /> : slas.length === 0 ? <DeskSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="slas" /> : (
        <EntityTable columns={["SLA Name", "Response Target", "Resolution Target", "Status", "Linked Queue"]}>
          {slas.map((sla) => (
            <EntityTableRow key={sla.id} columns={5}>
              <span className="font-medium">{sla.name}</span>
              <span>{sla.response_time_minutes} minutes</span>
              <span>{sla.resolution_time_minutes} minutes</span>
              <span className="flex gap-2"><PriorityBadge value={sla.priority} /><SLABadge value="active" /></span>
              <span className="text-muted-foreground">Queue placeholder</span>
            </EntityTableRow>
          ))}
        </EntityTable>
      )}
      <CreateSlaDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
