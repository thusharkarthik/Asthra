import { ProjectDetailView } from "@/components/settings/settings-admin-views";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailView projectId={Number(id)} />;
}
