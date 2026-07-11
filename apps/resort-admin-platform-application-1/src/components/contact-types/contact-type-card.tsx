import { Eye, Trash2 } from "lucide-react";
import { Card } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import { Badge } from "@resort/shadcn-ui";
import type { ContactType } from "@/services/contact-types";

export interface ContactTypeCardProps {
  contactType: ContactType;
  defaultName?: string;
  onView?: (contactType: ContactType) => void;
  onDelete?: (contactType: ContactType) => void;
}

export function ContactTypeCard({ contactType, defaultName, onView, onDelete }: ContactTypeCardProps) {
  const title = defaultName?.trim() || contactType.code;
  const subtitle = defaultName?.trim()
    ? `${contactType.code} · ID #${contactType.id}`
    : `ID #${contactType.id}`;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(contactType)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(contactType); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs">
            {contactType.code.slice(0, 3)}
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
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onView(contactType); }}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(contactType); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{contactType.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">
          {contactType.locales.length} locale{contactType.locales.length !== 1 ? "s" : ""}
        </span>
      </div>
    </Card>
  );
}
