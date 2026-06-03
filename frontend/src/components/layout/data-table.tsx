export function DataTablePlaceholder() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-3 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
        <span>Name</span>
        <span>Status</span>
        <span>Owner</span>
      </div>
      <div className="px-4 py-6 text-sm text-muted-foreground">Data table integration placeholder</div>
    </div>
  );
}
