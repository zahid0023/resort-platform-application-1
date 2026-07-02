import { Plus } from "lucide-react";
import { Button } from "@resort/shadcn-ui";

export interface NewButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function NewButton({ label, onClick, disabled, className }: NewButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled} className={className}>
      <Plus className="h-4 w-4 mr-1.5" />
      {label}
    </Button>
  );
}
