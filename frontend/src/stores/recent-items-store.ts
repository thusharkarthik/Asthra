import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RecentItem } from "@/types/platform";

type RecentItemsState = {
  viewed: RecentItem[];
  modified: RecentItem[];
  addViewed: (item: RecentItem) => void;
  addModified: (item: RecentItem) => void;
};

const uniqueByKey = (items: RecentItem[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.source}:${item.entity_type}:${item.entity_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
};

export const useRecentItemsStore = create<RecentItemsState>()(
  persist(
    (set) => ({
      viewed: [
        { source: "flow", entity_type: "work_item", entity_id: 101, title: "API gateway routing", href: "/flow/work-items/101", viewed_at: "2026-06-04T10:00:00.000Z" },
        { source: "docs", entity_type: "docs_page", entity_id: 44, title: "Platform beta guide", href: "/docs/pages/44", viewed_at: "2026-06-04T09:45:00.000Z" }
      ],
      modified: [
        { source: "pulse", entity_type: "incident", entity_id: 7, title: "API latency", href: "/pulse/incidents/7", modified_at: "2026-06-04T09:30:00.000Z" },
        { source: "dev", entity_type: "release", entity_id: 3, title: "Frontend beta release", href: "/dev/releases", modified_at: "2026-06-04T09:00:00.000Z" }
      ],
      addViewed: (item) => set((state) => ({ viewed: uniqueByKey([{ ...item, viewed_at: new Date().toISOString() }, ...state.viewed]) })),
      addModified: (item) => set((state) => ({ modified: uniqueByKey([{ ...item, modified_at: new Date().toISOString() }, ...state.modified]) }))
    }),
    {
      name: "asthra-recent-items",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
