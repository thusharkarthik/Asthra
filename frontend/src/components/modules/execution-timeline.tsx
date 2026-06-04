import { SimpleTimeline } from "@/components/modules/simple-timeline";

export function ExecutionTimeline({ executions }: { executions: Array<{ id: number; execution_status: string; execution_log?: string | null; started_at?: string | null }> }) {
  return (
    <SimpleTimeline
      items={executions.map((execution) => ({
        id: execution.id,
        title: execution.execution_status,
        content: execution.execution_log ?? `Execution ${execution.id}`,
        timestamp: execution.started_at ?? undefined
      }))}
    />
  );
}
