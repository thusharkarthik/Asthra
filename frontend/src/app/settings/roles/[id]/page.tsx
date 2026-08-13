import { RoleDetailView } from "@/components/settings/settings-admin-views";

export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoleDetailView roleId={Number(id)} />;
}
