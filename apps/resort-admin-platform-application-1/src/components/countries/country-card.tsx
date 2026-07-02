import { Eye, Trash2 } from "lucide-react";
import { Card } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import { Badge } from "@resort/shadcn-ui";
import type { Country } from "@/services/countries";

export interface CountryCardProps {
  country: Country;
  defaultName?: string;
  onNavigate?: (country: Country) => void;
  onView?: (country: Country) => void;
  onDelete?: (country: Country) => void;
}

export function CountryCard({ country, defaultName, onNavigate, onView, onDelete }: CountryCardProps) {
  const title = defaultName?.trim() || country.iso3_code || country.code;
  const subtitle = defaultName?.trim()
    ? `${country.iso3_code ?? country.code} · ID #${country.id}`
    : `ID #${country.id}`;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(country);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onNavigate?.(country)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate?.(country); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
            {country.code}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        <div
          className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onView && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onView(country); }}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mt-4">
        <div>
          <p className="text-xs text-muted-foreground">ISO3</p>
          <p className="font-medium">{country.iso3_code ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Phone</p>
          <p className="font-medium">{country.phone_code ?? "—"}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{country.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">{country.locales.length} locale{country.locales.length !== 1 ? "s" : ""}</span>
      </div>
    </Card>
  );
}
