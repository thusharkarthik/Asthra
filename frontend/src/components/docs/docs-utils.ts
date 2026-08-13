import type { Page, Space } from "@/types/docs";

export function spaceNameFor(page: Page, spaces: Space[]) {
  return spaces.find((space) => space.id === page.space_id)?.name ?? `Space ${page.space_id}`;
}

export function pageCountForSpace(spaceId: number, pages: Page[]) {
  return pages.filter((page) => page.space_id === spaceId).length;
}

export function sortedDocsPages(pages: Page[]) {
  return [...pages].sort((a, b) => {
    const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function docsDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
