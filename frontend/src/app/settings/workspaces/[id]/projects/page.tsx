import { ProjectsView } from "@/components/settings/settings-admin-views";

export default async function WorkspaceProjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectsView workspaceId={Number(id)} />;
}
