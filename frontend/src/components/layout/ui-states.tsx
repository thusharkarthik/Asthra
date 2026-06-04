import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageLoading({ label = "Loading page..." }: { label?: string }) {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function SectionLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex h-28 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return <div className={cn("h-32 animate-pulse rounded-lg border bg-muted", className)} aria-label="Loading card" />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card p-3" aria-label="Loading table">
      <div className="mb-3 h-8 animate-pulse rounded bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-9 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function EmptyModuleState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-card p-6 text-center">
      <Inbox className="mb-3 h-6 w-6 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function RetryButton({ onRetry }: { onRetry?: () => void }) {
  return (
    <Button size="sm" variant="outline" onClick={onRetry}>
      <RefreshCw className="h-3.5 w-3.5" />
      Retry
    </Button>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          {description && <p className="mt-1 text-destructive/80">{description}</p>}
          {onRetry && <div className="mt-3"><RetryButton onRetry={onRetry} /></div>}
        </div>
      </div>
    </div>
  );
}
