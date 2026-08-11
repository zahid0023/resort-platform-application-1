import { Eye, Globe, Mail, MousePointerClick, Phone, Radio, Trash2 } from "lucide-react";
import { Card, CardHeader, CardAction } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import type { CommunicationChannel } from "@/services/communication-channels";

export interface CommunicationChannelCardProps {
  channel: CommunicationChannel;
  defaultName?: string;
  onView?: (channel: CommunicationChannel) => void;
  onDelete?: (channel: CommunicationChannel) => void;
}

export function CommunicationChannelCard({ channel, defaultName, onView, onDelete }: CommunicationChannelCardProps) {
  const title = defaultName?.trim() || channel.code;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(channel);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(channel)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(channel); } }}
      className="group hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <CardHeader>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
            <Radio className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate font-mono">{channel.code}</p>
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
                onClick={(e) => { e.stopPropagation(); onView(channel); }}
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
      <div className="px-6 pb-4 pt-1 flex items-center gap-1.5">
        {channel.is_phone && <Phone className="h-3.5 w-3.5 text-muted-foreground" />}
        {channel.is_email && <Mail className="h-3.5 w-3.5 text-muted-foreground" />}
        {channel.is_url && <Globe className="h-3.5 w-3.5 text-muted-foreground" />}
        {channel.is_clickable && <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
    </Card>
  );
}
