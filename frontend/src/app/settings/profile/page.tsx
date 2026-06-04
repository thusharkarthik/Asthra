"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { useAuthStore } from "@/stores/auth-store";

export default function ProfileSettingsPage() {
  const currentUser = useAuthStore((state) => state.currentUser);

  return (
    <div className="space-y-6">
      <PageHeader title="Profile Settings" description="Signed-in user context from core-service authentication." />
      <DetailPanel title="Profile">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{currentUser?.full_name ?? "Not loaded"}</dd></div>
          <div><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{currentUser?.email ?? "Not loaded"}</dd></div>
          <div><dt className="text-muted-foreground">User ID</dt><dd className="font-medium">{currentUser?.id ?? "Not loaded"}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd className="font-medium">{currentUser?.is_active ? "Active" : "Unknown"}</dd></div>
        </dl>
      </DetailPanel>
    </div>
  );
}
