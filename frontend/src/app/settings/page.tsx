"use client";

import Link from "next/link";
import { Bell, SlidersHorizontal, UserCircle, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";

const settingsSections = [
  { title: "Profile", href: "/settings/profile", description: "Review signed-in user details.", icon: UserCircle },
  { title: "Workspace", href: "/settings/workspace", description: "Workspace and project context preferences.", icon: Users },
  { title: "Preferences", href: "/settings/preferences", description: "Theme, notifications, and shell preferences.", icon: SlidersHorizontal },
  { title: "Notifications", href: "/settings/preferences", description: "Notification preferences placeholder.", icon: Bell }
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Platform preferences and account context for the Asthra shell." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={`${section.title}-${section.href}`} href={section.href} className="rounded-lg border bg-card p-4 hover:bg-muted/60">
              <Icon className="mb-3 h-5 w-5 text-primary" />
              <div className="font-medium">{section.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            </Link>
          );
        })}
      </div>
      <DetailPanel title="Settings foundation">
        <p className="text-sm text-muted-foreground">
          These pages provide frontend placeholders for profile, workspace, theme, and notification preferences. Backend-backed preference storage is deferred.
        </p>
      </DetailPanel>
    </div>
  );
}
