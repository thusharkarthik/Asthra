import { PermissionDetailView } from "@/components/settings/settings-admin-views";

export default async function PermissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PermissionDetailView permissionId={Number(id)} />;
}
