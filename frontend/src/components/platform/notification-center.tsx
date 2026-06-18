"use client";

import Link from "next/link";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";

export function NotificationCenter({ open, onClose, placement = "top" }: { open: boolean; onClose: () => void; placement?: "top" | "bottom" }) {
  const notifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

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
        {notifications.map((item) => (
          <Link key={item.id} href={item.href ?? "#"} className="block rounded-md border p-3 hover:bg-muted" onClick={() => { markRead(item.id); onClose(); }}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-medium">{item.title}</div>
              {item.unread ? <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-label="Unread" /> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
