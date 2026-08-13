import { MembersView } from "@/components/settings/settings-admin-views";

export default async function WorkspaceMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MembersView workspaceId={Number(id)} />;
}
