import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center gap-3">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">This Asthra route is not available yet.</p>
      <Link className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" href="/">
        Go home
      </Link>
    </div>
  );
}
