import { EntityLink } from "@/components/platform/entity-link";
import type { CrossModuleLink } from "@/types/platform";

export function CrossModuleLinks({ links }: { links: CrossModuleLink[] }) {
  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div key={link.id} className="rounded-md border p-3">
          <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">{link.relation}</div>
          <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <EntityLink reference={link.from} compact />
            <div className="text-center text-xs text-muted-foreground">links to</div>
            <EntityLink reference={link.to} compact />
          </div>
        </div>
      ))}
    </div>
  );
}
