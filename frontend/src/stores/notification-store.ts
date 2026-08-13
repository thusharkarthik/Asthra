import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { NotificationItem } from "@/types/platform";

const seedNotifications: NotificationItem[] = [
  { id: "notif-1", type: "mention", title: "Mention in Docs", message: "You were mentioned in Platform beta guide.", href: "/docs/pages", unread: true, created_at: "2026-06-04T10:00:00.000Z" },
  { id: "notif-2", type: "incident", title: "Incident resolved", message: "API latency incident moved to resolved.", href: "/pulse/incidents", unread: true, created_at: "2026-06-04T09:30:00.000Z" },
  { id: "notif-3", type: "ai_assistant", title: "Assistant ready", message: "Workspace assistant can answer questions with memory context.", href: "/", unread: false, created_at: "2026-06-04T09:00:00.000Z" }
];

type NotificationState = {
  notifications: NotificationItem[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (notification: NotificationItem) => void;
  dismissNotification: (id: string) => void;
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: seedNotifications,
      markRead: (id) => set((state) => ({ notifications: state.notifications.map((item) => item.id === id ? { ...item, unread: false } : item) })),
      markAllRead: () => set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, unread: false })) })),
      addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
      dismissNotification: (id) => set((state) => ({ notifications: state.notifications.filter((item) => item.id !== id) }))
    }),
    {
      name: "asthra-notifications",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
