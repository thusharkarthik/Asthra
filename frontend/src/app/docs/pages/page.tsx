"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateDialog } from "@/components/modules/create-dialog";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { docsApi } from "@/services/api/docs-api";
import { useAuthStore } from "@/stores/auth-store";

export default function PagesPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const spacesQuery = useQuery({ queryKey: ["docs", "spaces"], queryFn: () => docsApi.listSpaces(accessToken ?? ""), enabled: Boolean(accessToken) });
  const [spaceId, setSpaceId] = useState<number | null>(null);
  const pagesQuery = useQuery({
    queryKey: ["docs", "pages", search],
    queryFn: () => search.trim() ? docsApi.searchPages(accessToken ?? "", search.trim()) : docsApi.listPages(accessToken ?? "", { limit: 50 }),
    enabled: Boolean(accessToken),
    retry: 1
  });
  const createMutation = useMutation({
    mutationFn: () => docsApi.createPage(accessToken ?? "", { space_id: spaceId ?? spacesQuery.data?.[0]?.id ?? 0, title, content, status: "draft", created_by_id: currentUser?.id ?? 1 }),
    onSuccess: () => {
      setCreateOpen(false);
      setTitle("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["docs", "pages"] });
    }
  });
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate();
  };

  return (
    <>
      <PageHeader title="Pages" description="Browse, create, and search Docs pages." />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input className="md:max-w-sm" placeholder="Search pages" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Button onClick={() => setCreateOpen(true)}>Create page</Button>
        </div>
        {(pagesQuery.data ?? []).length === 0 ? <EmptyState title="No pages found" /> : (
          <EntityTable columns={["Title", "Status", "Space"]}>
            {(pagesQuery.data ?? []).map((page) => (
              <EntityTableRow key={page.id} columns={3}>
                <Link href={`/docs/pages/${page.id}`} className="font-medium text-primary hover:underline">{page.title}</Link>
                <StatusBadge value={page.status ?? "draft"} />
                <span>{page.space_id}</span>
              </EntityTableRow>
            ))}
          </EntityTable>
        )}
      </div>
      <CreateDialog title="Create page" open={isCreateOpen} onOpenChange={setCreateOpen}>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={spaceId ?? spacesQuery.data?.[0]?.id ?? ""} onChange={(event) => setSpaceId(Number(event.target.value))}>
            {(spacesQuery.data ?? []).map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
          </select>
          <Input aria-label="Page title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input aria-label="Page content" placeholder="Content" value={content} onChange={(event) => setContent(event.target.value)} />
          <Button disabled={createMutation.isPending || !title.trim()}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
        </form>
      </CreateDialog>
    </>
  );
}
