import { TeamDetailView } from "@/components/settings/settings-admin-views";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TeamDetailView teamId={Number(id)} />;
}
