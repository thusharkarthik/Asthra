"use client";

import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { mediaNavItems } from "@/components/modules/module-navs";
import { AiPlaceholderPanel, ModuleEmptyState, ModuleSubnav } from "@/components/modules/product-experience";

export default function MediaAnnotationsPage() {
  const pathname = usePathname();
  return <div className="space-y-6"><PageHeader title="Annotations" description="Human and future AI annotations for media assets." /><ModuleSubnav items={mediaNavItems} activePath={pathname} /><ModuleEmptyState title="Annotations are asset-scoped" description="Open a media asset to view or add annotations. Future list views will aggregate annotations across the workspace." actionLabel="Browse Assets" href="/media/assets" /><AiPlaceholderPanel title="Future image and diagram understanding">Future multimodal AI can annotate diagrams, screenshots, documents, videos, and audio transcripts.</AiPlaceholderPanel></div>;
}
