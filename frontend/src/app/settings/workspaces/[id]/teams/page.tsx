import { TeamsView } from "@/components/settings/settings-admin-views";

export default async function WorkspaceTeamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TeamsView workspaceId={Number(id)} />;
}
