import { PermissionsView } from "@/components/settings/settings-admin-views";

export default async function OrganizationPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PermissionsView organizationId={Number(id)} />;
}
