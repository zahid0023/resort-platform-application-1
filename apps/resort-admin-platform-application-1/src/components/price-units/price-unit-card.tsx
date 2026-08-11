import { useTranslation } from "react-i18next";
import { Eye, Ruler, Trash2 } from "lucide-react";
import { Badge, Card, CardHeader, CardAction, CardFooter } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import type { PriceUnit } from "@/services/price-units";

export interface PriceUnitCardProps {
  priceUnit: PriceUnit;
  defaultName?: string;
  onView?: (priceUnit: PriceUnit) => void;
  onDelete?: (priceUnit: PriceUnit) => void;
}

export function PriceUnitCard({ priceUnit, defaultName, onView, onDelete }: PriceUnitCardProps) {
  const { t } = useTranslation();
  const title = defaultName?.trim() || priceUnit.code;
  const scopes = priceUnit.price_scopes ?? [];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(priceUnit);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(priceUnit)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(priceUnit); } }}
      className="group hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <CardHeader>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
            <Ruler className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate font-mono">{priceUnit.code}</p>
          </div>
        </div>
        {(onView || onDelete) && (
          <CardAction
            className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {onView && (
              <Button size="icon" variant="ghost" className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onView(priceUnit); }}
                title="View details"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </CardAction>
        )}
      </CardHeader>

      <CardFooter className="flex-wrap gap-1.5">
        {scopes.length > 0 ? (
          scopes.map((s) => (
            <Badge key={s.id} variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-5">
              {s.locale?.name ?? s.code}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">{t("priceUnit.noScopeAssigned")}</span>
        )}
      </CardFooter>
    </Card>
  );
}
