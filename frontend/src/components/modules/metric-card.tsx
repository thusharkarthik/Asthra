import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCard({ title, value, unit }: { title: string; value: string | number; unit?: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        {unit ? <div className="mt-1 text-sm text-muted-foreground">{unit}</div> : null}
      </CardContent>
    </Card>
  );
}
