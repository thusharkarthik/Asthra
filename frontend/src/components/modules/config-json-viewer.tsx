export function ConfigJsonViewer({ value }: { value?: unknown }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-md border bg-muted p-3 text-xs">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}
