import { useTranslation } from "react-i18next";
import { Eye, Tag, Trash2 } from "lucide-react";
import { Badge, Card, CardHeader, CardAction, CardFooter } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import type { PriceType } from "@/services/price-types";

export interface PriceTypeCardProps {
  priceType: PriceType;
  defaultName?: string;
  onView?: (priceType: PriceType) => void;
  onDelete?: (priceType: PriceType) => void;
}

export function PriceTypeCard({ priceType, defaultName, onView, onDelete }: PriceTypeCardProps) {
  const { t } = useTranslation();
  const title = defaultName?.trim() || priceType.code;
  const scopes = priceType.price_scopes ?? [];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(priceType);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(priceType)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(priceType); } }}
      className="group hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <CardHeader>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
            <Tag className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate font-mono">{priceType.code}</p>
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
                onClick={(e) => { e.stopPropagation(); onView(priceType); }}
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
          <span className="text-xs text-muted-foreground">{t("priceType.noScopeAssigned")}</span>
        )}
      </CardFooter>
    </Card>
  );
}
