import { WorkspacesView } from "@/components/settings/settings-admin-views";

export default async function OrganizationWorkspacesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkspacesView organizationId={Number(id)} />;
}
