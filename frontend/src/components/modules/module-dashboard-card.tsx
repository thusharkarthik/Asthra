import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ModuleDashboardCard({ title, value, children }: { title: string; value?: string | number; children?: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {value !== undefined ? <div className="mb-2 text-3xl font-semibold">{value}</div> : null}
        {children}
      </CardContent>
    </Card>
  );
}
