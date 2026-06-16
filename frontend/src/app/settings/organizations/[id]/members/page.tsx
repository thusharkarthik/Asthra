import { MembersView } from "@/components/settings/settings-admin-views";

export default async function OrganizationMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MembersView organizationId={Number(id)} />;
}
