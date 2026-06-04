"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

export default function PreferencesSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Preferences" description="Shell preferences for theme, notifications, and compact mode." />
      <DetailPanel title="Theme">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Theme preference</p>
            <p className="text-sm text-muted-foreground">Toggle between light and dark shell themes.</p>
          </div>
          <ThemeToggle />
        </div>
      </DetailPanel>
      <DetailPanel title="Notifications">
        <p className="text-sm text-muted-foreground">Notification channel preferences are placeholders until backend preference storage is added.</p>
      </DetailPanel>
      <DetailPanel title="Compact Mode">
        <p className="text-sm text-muted-foreground">Sidebar compact mode is available in the current browser session. Persisted compact preferences are deferred.</p>
      </DetailPanel>
    </div>
  );
}
