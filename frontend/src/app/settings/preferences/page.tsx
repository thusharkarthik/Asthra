"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { SettingsCard, SettingsLayout, SettingsSectionHeader } from "@/components/settings/settings-components";

const NOTIFICATION_PREFS_KEY = "asthra-notification-prefs";

type NotificationPrefs = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  digestFrequency: "immediate" | "daily" | "weekly";
};

const DEFAULT_PREFS: NotificationPrefs = {
  inAppEnabled: true,
  emailEnabled: false,
  digestFrequency: "immediate",
};

function loadNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (!stored) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function saveNotificationPrefs(prefs: NotificationPrefs) {
  try {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // storage errors are non-fatal
  }
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 ${checked ? "bg-primary" : "bg-muted"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function PreferencesSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPrefs(loadNotificationPrefs());
  }, []);

  function updatePref<K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      saveNotificationPrefs(next);
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Preferences" }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader title="Preferences" description="Customize your Asthra experience." />

      <SettingsCard title="Appearance">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Choose how Asthra looks to you.</p>
          <div className="flex gap-2">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${mounted && theme === value ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Notifications">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">In-app notifications</p>
              <p className="text-xs text-muted-foreground">Show notifications inside the app.</p>
            </div>
            <Toggle checked={prefs.inAppEnabled} onChange={(v) => updatePref("inAppEnabled", v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">Receive notifications via email. (Coming soon)</p>
            </div>
            <Toggle checked={prefs.emailEnabled} onChange={(v) => updatePref("emailEnabled", v)} disabled />
          </div>
          <div>
            <p className="text-sm font-medium mb-1.5">Digest frequency</p>
            <p className="text-xs text-muted-foreground mb-2">How often to send notification digests. (Coming soon)</p>
            <select
              value={prefs.digestFrequency}
              onChange={(e) => updatePref("digestFrequency", e.target.value as NotificationPrefs["digestFrequency"])}
              disabled
              className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-2 text-sm outline-none opacity-50 cursor-not-allowed"
            >
              <option value="immediate">Immediate</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>
          {saved ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Preferences saved.</p>
          ) : null}
        </div>
      </SettingsCard>

      <SettingsCard title="Language">
        <p className="text-sm text-muted-foreground">
          Language preference is managed on the{" "}
          <a href="/settings/profile" className="text-primary hover:underline">
            Profile page
          </a>
          .
        </p>
      </SettingsCard>
    </SettingsLayout>
  );
}
