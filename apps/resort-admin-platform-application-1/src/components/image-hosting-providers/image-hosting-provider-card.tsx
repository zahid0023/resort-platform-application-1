import { CloudIcon, Eye, Trash2 } from "lucide-react";
import { Card, CardHeader, CardAction, CardContent } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import type { ImageHostingProvider } from "@/services/image-hosting-providers";

export interface ImageHostingProviderCardProps {
  provider: ImageHostingProvider;
  onView?: (provider: ImageHostingProvider) => void;
  onDelete?: (provider: ImageHostingProvider) => void;
}

export function ImageHostingProviderCard({ provider, onView, onDelete }: ImageHostingProviderCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(provider);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(provider)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(provider); } }}
      className="group hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <CardHeader>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CloudIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{provider.name}</h3>
            <p className="text-xs text-muted-foreground truncate font-mono">{provider.code}</p>
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
                onClick={(e) => { e.stopPropagation(); onView(provider); }}
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
        <p className="text-sm text-muted-foreground line-clamp-2">
          {provider.description || "No description"}
        </p>
      </CardContent>
    </Card>
  );
}
