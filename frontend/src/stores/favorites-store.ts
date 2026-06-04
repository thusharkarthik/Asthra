import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FavoriteItem } from "@/types/platform";

type FavoritesState = {
  favorites: FavoriteItem[];
  addFavorite: (item: Omit<FavoriteItem, "favorited_at">) => void;
  removeFavorite: (source: string, entityType: string, entityId: string | number) => void;
  isFavorite: (source: string, entityType: string, entityId: string | number) => boolean;
};

const keyFor = (source: string, entityType: string, entityId: string | number) => `${source}:${entityType}:${entityId}`;

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [
        { source: "flow", entity_type: "work_item", entity_id: 101, title: "API gateway routing", href: "/flow/work-items/101", favorited_at: "2026-06-04T10:00:00.000Z" },
        { source: "docs", entity_type: "docs_page", entity_id: 44, title: "Platform beta guide", href: "/docs/pages/44", favorited_at: "2026-06-04T09:30:00.000Z" },
        { source: "insights", entity_type: "dashboard", entity_id: "workspace", title: "Workspace dashboard", href: "/insights", favorited_at: "2026-06-04T09:00:00.000Z" }
      ],
      addFavorite: (item) => set((state) => {
        const key = keyFor(item.source, item.entity_type, item.entity_id);
        if (state.favorites.some((favorite) => keyFor(favorite.source, favorite.entity_type, favorite.entity_id) === key)) return state;
        return { favorites: [{ ...item, favorited_at: new Date().toISOString() }, ...state.favorites].slice(0, 20) };
      }),
      removeFavorite: (source, entityType, entityId) => set((state) => ({ favorites: state.favorites.filter((item) => keyFor(item.source, item.entity_type, item.entity_id) !== keyFor(source, entityType, entityId)) })),
      isFavorite: (source, entityType, entityId) => get().favorites.some((item) => keyFor(item.source, item.entity_type, item.entity_id) === keyFor(source, entityType, entityId))
    }),
    {
      name: "asthra-favorites",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
