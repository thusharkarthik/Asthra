"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState, PageLoading } from "@/components/layout/ui-states";
import { DetailPanel } from "@/components/modules/detail-panel";
import { SourceBadge } from "@/components/platform/entity-badges";
import { platformApi } from "@/services/api/platform-api";
import { useAuthStore } from "@/stores/auth-store";

const fallbackHealth = {
  gateway: { service: "asthra-api-gateway", version: "0.1.0", environment: "development", status: "ready" },
  status: "demo",
  services: [
    { name: "core-service", route_prefix: "core", status: "configured", health_url: "http://localhost:8000/health" },
    { name: "flow-service", route_prefix: "flow", status: "configured", health_url: "http://localhost:8001/health" },
    { name: "docs-service", route_prefix: "docs", status: "configured", health_url: "http://localhost:8002/health" },
    { name: "ai-service", route_prefix: "ai", status: "configured", health_url: "http://localhost:8003/health" }
  ]
};

export default function PlatformHealthPage() {
  const token = useAuthStore((state) => state.accessToken);
  const healthQuery = useQuery({
    queryKey: ["platform", "health"],
    queryFn: async () => {
      try {
        return await platformApi.getHealth(token ?? "");
      } catch {
        return fallbackHealth;
      }
    },
    retry: 0
  });

  if (healthQuery.isLoading) return <PageLoading label="Loading platform health..." />;
  if (!healthQuery.data) return <ErrorState title="Unable to load platform health" onRetry={() => healthQuery.refetch()} />;

  const gateway = healthQuery.data.gateway as Record<string, unknown>;
  const services = healthQuery.data.services as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Health" description="Gateway, service readiness, and version information for local beta demos." />
      <div className="grid gap-4 md:grid-cols-4">
        <DetailPanel title="Gateway">
          <div className="space-y-2 text-sm">
            <div className="font-medium">{String(gateway.service ?? "api-gateway")}</div>
            <div className="text-muted-foreground">Version {String(gateway.version ?? "unknown")}</div>
            <SourceBadge source={String(gateway.status ?? "unknown")} />
          </div>
        </DetailPanel>
        <DetailPanel title="Environment"><div className="text-sm">{String(gateway.environment ?? "development")}</div></DetailPanel>
        <DetailPanel title="Overall Status"><div className="text-sm font-medium">{healthQuery.data.status}</div></DetailPanel>
        <DetailPanel title="Services"><div className="text-3xl font-semibold">{services.length}</div></DetailPanel>
      </div>
      <DetailPanel title="Service Readiness">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Service</th><th>Route</th><th>Status</th><th>Health URL</th></tr></thead>
            <tbody>
              {services.map((service) => (
                <tr key={String(service.name)} className="border-t">
                  <td className="py-2 font-medium">{String(service.name)}</td>
                  <td>{String(service.route_prefix ?? "-")}</td>
                  <td><SourceBadge source={String(service.status ?? "unknown")} /></td>
                  <td className="text-muted-foreground">{String(service.health_url ?? "-")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailPanel>
    </div>
  );
}
