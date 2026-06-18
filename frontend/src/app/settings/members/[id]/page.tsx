import { MemberDetailView } from "@/components/settings/settings-admin-views";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MemberDetailView userId={Number(id)} />;
}
