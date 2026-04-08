import { cn } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import defaults from "./default.json";

export interface Hero4Props {
  badge?: string;
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  backgroundColor?: string;
}

const Hero4 = ({
  badge = defaults.badge,
  title = defaults.title,
  description = defaults.description,
  primaryButtonText = defaults.primaryButtonText,
  secondaryButtonText = defaults.secondaryButtonText,
  backgroundColor = defaults.backgroundColor,
}: Hero4Props) => {
  return (
    <div
      className={cn("flex flex-col w-full h-full justify-center items-center gap-6 py-12 text-center")}
      style={{ backgroundColor }}
    >
      {badge && <Badge variant="secondary">{badge}</Badge>}
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-xl text-muted-foreground">{description}</p>
      <div className="flex gap-3">
        <Button>{primaryButtonText}</Button>
        <Button variant="outline">{secondaryButtonText}</Button>
      </div>
    </div>
  );
};

export default Hero4;
