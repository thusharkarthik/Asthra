"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center gap-3">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">The platform shell caught an unexpected rendering error.</p>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
