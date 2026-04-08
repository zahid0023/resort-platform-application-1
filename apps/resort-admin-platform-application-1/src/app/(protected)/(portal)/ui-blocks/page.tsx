"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UI_BLOCKS_INDEX, type UiBlockMeta } from "ui-blocks";
import { listUiBlockDefinitions, type UiBlockDefinitionSummary } from "@/services/ui-block-definitions";
import { ApproveUiBlockDialog } from "@/components/ui-blocks/approve-ui-block-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BlockWithDefinition {
  meta: UiBlockMeta;
  definition?: UiBlockDefinitionSummary;
}

function BlockCard({
  meta,
  onPreview,
  onApprove,
}: {
  meta: UiBlockMeta;
  onPreview: () => void;
  onApprove?: () => void;
}) {
  const UIBlock = meta.component;
  return (
    <div className="flex flex-col rounded-xl border bg-card ring-1 ring-foreground/10 overflow-hidden">
      <div
        onClick={onPreview}
        className="h-48 overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary"
      >
        <div className="pointer-events-none w-full origin-top scale-90 p-3">
          <UIBlock {...meta.defaults} />
        </div>
      </div>
      {onApprove && (
        <div className="flex justify-end px-3 py-2 border-t bg-muted/30">
          <Button size="sm" onClick={onApprove}>
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}

export default function UiBlocksPage() {
  const router = useRouter();
  const [definitions, setDefinitions] = useState<UiBlockDefinitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveTarget, setApproveTarget] = useState<UiBlockMeta | null>(null);

  function fetchDefinitions() {
    setLoading(true);
    listUiBlockDefinitions({ size: 50 })
      .then((res) => setDefinitions(res.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load definitions."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchDefinitions();
  }, []);

  const definitionByKey = new Map(definitions.map((d) => [d.ui_block_key, d]));

  const accepted: BlockWithDefinition[] = [];
  const rejected: BlockWithDefinition[] = [];
  const notReviewed: BlockWithDefinition[] = [];

  for (const meta of UI_BLOCKS_INDEX) {
    const definition = definitionByKey.get(meta.key);
    if (!definition) {
      notReviewed.push({ meta });
    } else if (definition.status === "Accepted") {
      accepted.push({ meta, definition });
    } else {
      rejected.push({ meta, definition });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">UI Blocks</h1>
        <p className="text-sm text-muted-foreground">Review and approve UI blocks for use in the platform.</p>
      </div>

      <Tabs defaultValue="not-reviewed">
        <TabsList>
          <TabsTrigger value="not-reviewed">
            Not Reviewed
            {!loading && notReviewed.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                {notReviewed.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted
            {!loading && accepted.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                {accepted.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected
            {!loading && rejected.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                {rejected.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="not-reviewed" className="mt-6">
          {loading ? (
            <EmptyState message="Loading…" />
          ) : notReviewed.length === 0 ? (
            <EmptyState message="All blocks have been reviewed." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {notReviewed.map(({ meta }) => (
                <BlockCard
                  key={meta.key}
                  meta={meta}
                  onPreview={() => router.push(`/ui-blocks/${meta.key}`)}
                  onApprove={() => setApproveTarget(meta)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          {loading ? (
            <EmptyState message="Loading…" />
          ) : accepted.length === 0 ? (
            <EmptyState message="No blocks approved yet." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {accepted.map(({ meta }) => (
                <BlockCard
                  key={meta.key}
                  meta={meta}
                  onPreview={() => router.push(`/ui-blocks/${meta.key}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {loading ? (
            <EmptyState message="Loading…" />
          ) : rejected.length === 0 ? (
            <EmptyState message="No blocks have been rejected." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rejected.map(({ meta }) => (
                <BlockCard
                  key={meta.key}
                  meta={meta}
                  onPreview={() => router.push(`/ui-blocks/${meta.key}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {approveTarget && (
        <ApproveUiBlockDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setApproveTarget(null);
              fetchDefinitions();
            }
          }}
          blockKey={approveTarget.key}
          blockName={approveTarget.name}
          blockDescription={approveTarget.description}
          blockSchema={approveTarget.schema}
          blockDefaults={approveTarget.defaults}
        />
      )}
    </div>
  );
}
