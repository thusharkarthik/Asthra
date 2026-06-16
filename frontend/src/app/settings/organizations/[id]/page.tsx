import { OrganizationDetailView } from "@/components/settings/settings-admin-views";

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrganizationDetailView organizationId={Number(id)} />;
}
