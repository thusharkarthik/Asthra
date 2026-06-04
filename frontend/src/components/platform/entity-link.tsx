import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { EntityBadge, SourceBadge } from "@/components/platform/entity-badges";
import type { EntityReference } from "@/types/platform";

export function EntityLink({ reference, compact = false }: { reference: EntityReference; compact?: boolean }) {
  return (
    <Link href={reference.href} className="block rounded-md border p-3 hover:bg-muted">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{reference.title}</div>
          {!compact && reference.description ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{reference.description}</p> : null}
          <div className="mt-2 flex flex-wrap gap-2"><SourceBadge source={reference.source} /><EntityBadge entityType={reference.entity_type} /></div>
        </div>
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  );
}
