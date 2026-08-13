"use client";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyModuleState } from "@/components/layout/ui-states";
import { FavoritesList } from "@/components/platform/recent-favorites";
import { useFavoritesStore } from "@/stores/favorites-store";

export default function FavoritesPage() {
  const favorites = useFavoritesStore((state) => state.favorites);

  return (
    <div className="space-y-6">
      <PageHeader title="Favorites" description="Quick access to favorite work items, pages, dashboards, and projects." />
      {favorites.length === 0 ? (
        <EmptyModuleState title="No favorites yet" description="Favorite important entities from module pages as that UI is added." />
      ) : (
        <FavoritesList items={favorites} />
      )}
    </div>
  );
}
