"use client";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyModuleState } from "@/components/layout/ui-states";
import { DetailPanel } from "@/components/modules/detail-panel";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function WorkspaceSettingsPage() {
  const { organizations, workspaces, projects, selectedOrganizationId, selectedWorkspaceId, selectedProjectId } = useWorkspaceStore();

  return (
    <div className="space-y-6">
      <PageHeader title="Workspace Settings" description="Selected organization, workspace, and project context." />
      <DetailPanel title="Current Selection">
        {selectedWorkspaceId ? (
          <dl className="grid gap-3 text-sm md:grid-cols-3">
            <div><dt className="text-muted-foreground">Organization</dt><dd className="font-medium">{organizations.find((item) => item.id === selectedOrganizationId)?.name ?? selectedOrganizationId}</dd></div>
            <div><dt className="text-muted-foreground">Workspace</dt><dd className="font-medium">{workspaces.find((item) => item.id === selectedWorkspaceId)?.name ?? selectedWorkspaceId}</dd></div>
            <div><dt className="text-muted-foreground">Project</dt><dd className="font-medium">{projects.find((item) => item.id === selectedProjectId)?.name ?? selectedProjectId ?? "None"}</dd></div>
          </dl>
        ) : (
          <EmptyModuleState title="No workspace selected" description="Use the header selectors to choose a workspace." />
        )}
      </DetailPanel>
      <DetailPanel title="Workspace Preferences">
        <p className="text-sm text-muted-foreground">Default landing module, pinned modules, and project preferences will be stored here in a later pass.</p>
      </DetailPanel>
    </div>
  );
}
