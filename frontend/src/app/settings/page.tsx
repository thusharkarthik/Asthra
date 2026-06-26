"use client";

import Link from "next/link";
import { useSettingsAuthority } from "@/app/settings/layout";
import { SettingsHomeView } from "@/components/settings/settings-admin-views";
import { SettingsLayout, SettingsSectionHeader } from "@/components/settings/settings-components";

const PERSONAL_CARDS = [
  { title: "Profile", href: "/settings/profile" },
  { title: "Preferences", href: "/settings/preferences" },
  { title: "Notifications", href: "/settings/notifications" },
  { title: "Account", href: "/settings/account" },
];

export default function SettingsPage() {
  const { authorityLevel } = useSettingsAuthority();

  if (authorityLevel === "member") {
    return (
      <SettingsLayout breadcrumbs={[{ label: "Settings" }]} backHref="/" backLabel="Back to Home">
        <SettingsSectionHeader
          title="Settings"
          description="Manage your personal preferences and account settings."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PERSONAL_CARDS.map((card) => (
            <Link key={card.title} href={card.href} className="rounded-lg border bg-card p-4 hover:bg-muted/60">
              <div className="text-sm text-muted-foreground">{card.title}</div>
              <div className="mt-2 text-2xl font-semibold">Open</div>
            </Link>
          ))}
        </div>
      </SettingsLayout>
    );
  }

  return <SettingsHomeView />;
}
