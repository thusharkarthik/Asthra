"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";

export function NotificationCenter({ open, onClose, placement = "top" }: { open: boolean; onClose: () => void; placement?: "top" | "bottom" }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const router = useRouter();
  const queryClient = useQueryClient();
  const notifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const dismissNotification = useNotificationStore((state) => state.dismissNotification);
  const panelRef = useRef<HTMLDivElement>(null);
  const coreNotificationsQuery = useQuery({
    queryKey: ["core", "notifications"],
    queryFn: () => settingsApi.listNotifications(accessToken ?? ""),
    enabled: Boolean(accessToken && open),
    retry: 1
  });
  const markCoreReadMutation = useMutation({
    mutationFn: (notificationId: number) => settingsApi.markNotificationRead(accessToken ?? "", notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["core", "notifications"] })
  });
  const markAllCoreReadMutation = useMutation({
    mutationFn: () => settingsApi.markAllNotificationsRead(accessToken ?? ""),
    onSuccess: () => {
      markAllRead();
      queryClient.invalidateQueries({ queryKey: ["core", "notifications"] });
    }
  });
  const deleteCoreMutation = useMutation({
    mutationFn: (notificationId: number) => settingsApi.deleteNotification(accessToken ?? "", notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["core", "notifications"] })
  });
  const coreNotifications = (coreNotificationsQuery.data ?? []).map((item) => ({
    id: `core-${item.id}`,
    coreId: item.id,
    type: item.type,
    title: item.title,
    message: item.message,
    href: notificationHref(item.entity_type, item.entity_id),
    unread: !item.is_read,
    created_at: item.created_at ?? new Date().toISOString()
  }));
  const allNotifications = [...coreNotifications, ...notifications];

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={cn("absolute right-0 z-40 w-80 rounded-md border bg-card p-3 shadow-lg", placement === "bottom" ? "bottom-11" : "top-11")}
      role="dialog"
      aria-label="Notification center"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold"><Bell className="h-4 w-4" />Notifications</div>
        <Button size="icon" variant="ghost" aria-label="Close notifications" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="mb-3 flex justify-end"><Button size="sm" variant="outline" onClick={() => { markAllRead(); if (accessToken) markAllCoreReadMutation.mutate(); }}>Mark all read</Button></div>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {allNotifications.map((item) => (
          <div key={item.id} className="block rounded-md border p-3 hover:bg-muted" onClick={() => {
            if ("coreId" in item && typeof item.coreId === "number") markCoreReadMutation.mutate(item.coreId);
            else markRead(item.id);
            if (item.href) {
              onClose();
              router.push(item.href);
            }
          }}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="flex shrink-0 items-center gap-1">
                {item.unread ? <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" /> : null}
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Dismiss notification"
                  className="h-6 w-6"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if ("coreId" in item && typeof item.coreId === "number") deleteCoreMutation.mutate(item.coreId);
                    else dismissNotification(item.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
            {item.type === "invitation.pending" ? (
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" type="button" onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}>Accept</Button>
                <Button size="sm" variant="outline" type="button" onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}>Decline</Button>
              </div>
            ) : null}
          </div>
        ))}
        {allNotifications.length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No notifications yet.</p> : null}
      </div>
    </div>
  );
}

function notificationHref(entityType?: string | null, entityId?: string | null) {
  const id = entityId ? encodeURIComponent(entityId) : null;
  if (entityType === "organization" && id) return `/settings/organizations/${id}`;
  if (entityType === "workspace" && id) return `/settings/workspaces/${id}`;
  if (entityType === "project" && id) return `/settings/projects/${id}`;
  if (entityType === "member" || entityType === "invitation" || entityType === "organization_member" || entityType === "workspace_member") return "/settings/members";
  if (entityType === "role" || entityType === "permission" || entityType === "role_assignment") return "/settings/access-control";
  if (entityType === "flow_work_item" && id) return `/flow/work-items/${id}`;
  if (entityType === "docs_page" && id) return `/docs/pages/${id}`;
  if (entityType === "discover_idea" && id) return `/discover/ideas/${id}`;
  if (entityType === "desk_ticket" && id) return `/desk/tickets/${id}`;
  if (entityType === "pulse_incident" && id) return `/pulse/incidents/${id}`;
  return undefined;
}
