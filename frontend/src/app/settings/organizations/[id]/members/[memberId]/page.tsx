import { MemberDetailView } from "@/components/settings/settings-admin-views";

export default async function OrganizationMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string; memberId: string }>;
}) {
  const { id, memberId } = await params;
  return <MemberDetailView userId={Number(memberId)} scope={{ type: "organization", organizationId: Number(id) }} />;
}
