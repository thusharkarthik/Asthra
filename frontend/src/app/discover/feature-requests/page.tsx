"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateFeatureRequestDialog } from "@/components/discover/discover-create-dialogs";
import { DiscoverSetupState } from "@/components/discover/discover-setup-state";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { DISCOVER_REQUEST_STATUSES, discoverDate } from "@/components/discover/discover-utils";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function FeatureRequestsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const requestsQuery = useQuery({
    queryKey: ["discover", "feature-requests", selectedWorkspaceId],
    queryFn: () => discoverApi.listFeatureRequests(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  const requests = requestsQuery.data ?? [];
  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesSearch = !term || `${request.title} ${request.description} ${request.source ?? ""} ${request.requested_by ?? ""}`.toLowerCase().includes(term);
      const matchesStatus = status === "all" || request.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, status]);

  return (
    <div className="space-y-6">
      <PageHeader title="Feature Requests" description="Capture asks from customers, stakeholders, and internal teams." actions={<Button onClick={() => setOpen(true)}>Add feature request</Button>} />
      <DiscoverSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_180px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input aria-label="Search feature requests" className="pl-9" placeholder="Search requests, sources, or requesters" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <Select aria-label="Filter requests by status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              {DISCOVER_REQUEST_STATUSES.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
            </Select>
          </div>
          {requestsQuery.isLoading ? <LoadingState /> : requests.length === 0 ? <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="feature-requests" /> : filteredRequests.length === 0 ? <EmptyState title="No feature requests match the current filters" /> : (
            <EntityTable columns={["Title", "Status", "Source", "Requested By", "Updated"]}>
              {filteredRequests.map((request) => (
                <EntityTableRow key={request.id} columns={5}>
                  <span className="font-medium">{request.title}</span>
                  <StatusBadge value={request.status} />
                  <span>{request.source ?? "Unknown"}</span>
                  <span>{request.requested_by ?? "Not captured"}</span>
                  <span className="text-muted-foreground">{discoverDate(request.updated_at ?? request.created_at)}</span>
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
        </div>
      )}
      <CreateFeatureRequestDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
