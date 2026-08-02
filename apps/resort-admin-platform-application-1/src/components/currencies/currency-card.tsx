import { Coins, Eye, Trash2 } from "lucide-react";
import { Card, CardHeader, CardAction, CardContent } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import { Badge } from "@resort/shadcn-ui";
import type { Currency } from "@/services/currencies";

export interface CurrencyCardProps {
  currency: Currency;
  defaultName?: string;
  onView?: (currency: Currency) => void;
  onDelete?: (currency: Currency) => void;
}

export function CurrencyCard({ currency, defaultName, onView, onDelete }: CurrencyCardProps) {
  const title = defaultName?.trim() || currency.code;
  const subtitle = defaultName?.trim() ? currency.code : undefined;
  const countryName = currency.country.locale?.name ?? currency.country.code;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(currency);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(currency)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(currency); } }}
      className="group hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <CardHeader>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold">
            {currency.symbol || <Coins className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground truncate font-mono">{subtitle}</p>}
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
                onClick={(e) => { e.stopPropagation(); onView(currency); }}
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

      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Country</p>
            <p className="font-medium truncate">{countryName} ({currency.country.code})</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Numeric Code</p>
            <p className="font-medium font-mono">{currency.numeric_code}</p>
          </div>
        </div>
        {currency.is_default && (
          <Badge variant="secondary" className="mt-3">Default</Badge>
        )}
      </CardContent>
    </Card>
  );
}
