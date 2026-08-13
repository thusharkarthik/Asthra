import { describe, expect, it } from "vitest";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useRecentItemsStore } from "@/stores/recent-items-store";

describe("platform stores", () => {
  it("tracks favorites", () => {
    useFavoritesStore.getState().addFavorite({ source: "flow", entity_type: "work_item", entity_id: 999, title: "Favorite task", href: "/flow/work-items/999" });
    expect(useFavoritesStore.getState().isFavorite("flow", "work_item", 999)).toBe(true);
    useFavoritesStore.getState().removeFavorite("flow", "work_item", 999);
    expect(useFavoritesStore.getState().isFavorite("flow", "work_item", 999)).toBe(false);
  });

  it("tracks recent viewed and modified items", () => {
    useRecentItemsStore.getState().addViewed({ source: "docs", entity_type: "docs_page", entity_id: 88, title: "Recent page", href: "/docs/pages/88" });
    useRecentItemsStore.getState().addModified({ source: "pulse", entity_type: "incident", entity_id: 77, title: "Recent incident", href: "/pulse/incidents/77" });
    expect(useRecentItemsStore.getState().viewed[0].title).toBe("Recent page");
    expect(useRecentItemsStore.getState().modified[0].title).toBe("Recent incident");
  });

  it("tracks notification read state", () => {
    useNotificationStore.getState().addNotification({ id: "test-notif", type: "comment", title: "Comment", message: "New comment", unread: true, created_at: "2026-06-04T10:00:00.000Z" });
    expect(useNotificationStore.getState().notifications.find((item) => item.id === "test-notif")?.unread).toBe(true);
    useNotificationStore.getState().markRead("test-notif");
    expect(useNotificationStore.getState().notifications.find((item) => item.id === "test-notif")?.unread).toBe(false);
  });
});
