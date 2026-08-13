import { RolesView } from "@/components/settings/settings-admin-views";

export default async function OrganizationRolesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RolesView organizationId={Number(id)} />;
}
