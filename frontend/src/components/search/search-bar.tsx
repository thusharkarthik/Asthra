"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";

export function SearchBar() {
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);

  return (
    <Button
      variant="outline"
      className="h-9 w-full justify-start gap-2 text-muted-foreground md:w-72"
      onClick={() => setSearchOpen(true)}
    >
      <Search className="h-4 w-4" />
      <span>Search Asthra</span>
    </Button>
  );
}
