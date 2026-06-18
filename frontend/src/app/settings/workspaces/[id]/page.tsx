import { WorkspaceDetailView } from "@/components/settings/settings-admin-views";

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkspaceDetailView workspaceId={Number(id)} />;
}
