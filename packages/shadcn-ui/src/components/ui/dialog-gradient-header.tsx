import { Sparkles } from "lucide-react";

interface DialogGradientHeaderProps {
  eyebrow: string;
  title: string;
}

export function DialogGradientHeader({ eyebrow, title }: DialogGradientHeaderProps) {
  return (
    <div className="relative bg-gradient-ocean text-primary-foreground p-8">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary-foreground/70 mb-3">
        <Sparkles className="h-3 w-3" />
        {eyebrow}
      </div>
      <h2 className="font-display text-3xl">{title}</h2>
    </div>
  );
}
