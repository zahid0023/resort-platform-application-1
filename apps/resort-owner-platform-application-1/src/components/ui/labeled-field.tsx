import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LabeledFieldProps {
  label: string;
  icon?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function LabeledField({ label, icon, htmlFor, className, children }: LabeledFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={htmlFor}
        className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5"
      >
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
