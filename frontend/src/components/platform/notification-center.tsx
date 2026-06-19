"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";

export function NotificationCenter({ open, onClose, placement = "top" }: { open: boolean; onClose: () => void; placement?: "top" | "bottom" }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const notifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
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
  const coreNotifications = (coreNotificationsQuery.data ?? []).map((item) => ({
    id: `core-${item.id}`,
    coreId: item.id,
    type: item.type,
    title: item.title,
    message: item.message,
    href: item.entity_type === "invitation" ? "/settings/members" : undefined,
    unread: !item.is_read,
    created_at: item.created_at ?? new Date().toISOString()
  }));
  const allNotifications = [...coreNotifications, ...notifications];

  if (!open) return null;

  return (
    <div
      className={cn("absolute right-0 z-40 w-80 rounded-md border bg-card p-3 shadow-lg", placement === "bottom" ? "bottom-11" : "top-11")}
      role="dialog"
      aria-label="Notification center"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold"><Bell className="h-4 w-4" />Notifications</div>
        <Button size="icon" variant="ghost" aria-label="Close notifications" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="mb-3 flex justify-end"><Button size="sm" variant="outline" onClick={markAllRead}>Mark all read</Button></div>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {allNotifications.map((item) => (
          <div key={item.id} className="block rounded-md border p-3 hover:bg-muted" onClick={() => {
            if ("coreId" in item && typeof item.coreId === "number") markCoreReadMutation.mutate(item.coreId);
            else markRead(item.id);
          }}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-medium">{item.title}</div>
              {item.unread ? <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-label="Unread" /> : null}
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
