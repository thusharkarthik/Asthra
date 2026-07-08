"use client";

import { AccessControlView } from "@/components/settings/settings-admin-views";
import { usePagePermissions } from "@/hooks/use-page-permissions";

export default function AccessControlPage() {
  usePagePermissions();
  return <AccessControlView section="roles" />;
}
