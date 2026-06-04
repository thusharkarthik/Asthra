import { Button } from "@/components/ui/button";

export function QuickCreateButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button onClick={onClick}>{label}</Button>;
}
