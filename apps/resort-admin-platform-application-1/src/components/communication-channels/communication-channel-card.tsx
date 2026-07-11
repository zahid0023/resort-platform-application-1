import { Eye, Mail, Phone, Trash2, Globe, MousePointerClick } from "lucide-react";
import { Card } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import { Badge } from "@resort/shadcn-ui";
import type { CommunicationChannel } from "@/services/communication-channels";

export interface CommunicationChannelCardProps {
  channel: CommunicationChannel;
  defaultName?: string;
  onView?: (channel: CommunicationChannel) => void;
  onDelete?: (channel: CommunicationChannel) => void;
}

export function CommunicationChannelCard({ channel, defaultName, onView, onDelete }: CommunicationChannelCardProps) {
  const title = defaultName?.trim() || channel.code;
  const subtitle = defaultName?.trim()
    ? `${channel.code} · ID #${channel.id}`
    : `ID #${channel.id}`;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(channel)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(channel); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs">
            {channel.code.slice(0, 3)}
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
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onView(channel); }}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(channel); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {channel.is_phone && <Phone className="h-3.5 w-3.5 text-muted-foreground" />}
          {channel.is_email && <Mail className="h-3.5 w-3.5 text-muted-foreground" />}
          {channel.is_url && <Globe className="h-3.5 w-3.5 text-muted-foreground" />}
          {channel.is_clickable && <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">#{channel.sort_order}</Badge>
          <span className="text-xs text-muted-foreground">
            {channel.locales.length} locale{channel.locales.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </Card>
  );
}
