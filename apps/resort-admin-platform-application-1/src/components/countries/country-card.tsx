import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Eye, Trash2 } from "lucide-react";
import { Card, CardHeader, CardAction, CardContent, CardFooter } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import type { Country } from "@/services/countries";

export interface CountryCardProps {
  country: Country;
  defaultName?: string;
  onNavigate?: (country: Country) => void;
  onView?: (country: Country) => void;
  onDelete?: (country: Country) => void;
}

export function CountryCard({ country, defaultName, onNavigate, onView, onDelete }: CountryCardProps) {
  const { t } = useTranslation();
  const [flagFailed, setFlagFailed] = useState(false);
  const title = defaultName?.trim() || country.iso3_code || country.code;
  const subtitle = country.code;
  const showFlag = !!country.flag_url && !flagFailed;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(country);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(country)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(country); } }}
      className="group hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <CardHeader>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 text-primary flex items-center justify-center font-semibold shrink-0 overflow-hidden">
            {showFlag ? (
              <img
                src={country.flag_url}
                alt={country.code}
                className="w-full h-full object-cover"
                onError={() => setFlagFailed(true)}
              />
            ) : (
              country.code
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
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
                onClick={(e) => { e.stopPropagation(); onView(country); }}
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
            <p className="text-xs text-muted-foreground">ISO3</p>
            <p className="font-medium">{country.iso3_code ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium">{country.phone_code ? `+${country.phone_code}` : "—"}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter
        className="justify-between text-xs font-medium text-primary hover:underline"
        onClick={(e) => { e.stopPropagation(); onNavigate?.(country); }}
      >
        <span>{t("countries.viewCities")}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </CardFooter>
    </Card>
  );
}
