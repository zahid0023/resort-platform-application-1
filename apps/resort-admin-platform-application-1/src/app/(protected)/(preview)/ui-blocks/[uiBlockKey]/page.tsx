"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { UIBlockPreviewPage, type UiBlockMeta } from "ui-blocks";
import { ApproveUiBlockDialog } from "@/components/ui-blocks/approve-ui-block-dialog";
import { RejectUiBlockDialog } from "@/components/ui-blocks/reject-ui-block-dialog";
import { Button } from "@/components/ui/button";
import {
  listUiBlockDefinitions,
  updateUiBlockDefinition,
  type UiBlockDefinitionSummary,
} from "@/services/ui-block-definitions";

type ApprovalMeta = Pick<UiBlockMeta, "key" | "name" | "description" | "schema" | "defaults">;

export default function UiBlockPreviewRoute() {
  const params = useParams<{ uiBlockKey: string }>();
  const uiBlockKey = Array.isArray(params.uiBlockKey)
    ? params.uiBlockKey[0]
    : params.uiBlockKey;

  const [approvalMeta, setApprovalMeta] = useState<ApprovalMeta | null>(null);
  const [rejectMeta, setRejectMeta] = useState<ApprovalMeta | null>(null);
  const [definition, setDefinition] = useState<UiBlockDefinitionSummary | null | undefined>(undefined);

  function fetchDefinition() {
    if (!uiBlockKey) return;
    listUiBlockDefinitions({ size: 50 })
      .then((res) => {
        const found = res.data.find((d) => d.ui_block_key === uiBlockKey);
        setDefinition(found ?? null);
      })
      .catch(() => setDefinition(null));
  }

  useEffect(() => {
    fetchDefinition();
  }, [uiBlockKey]);

  const isAccepted = definition?.status === "Accepted";

  const actionSlot = isAccepted ? (
    <Button size="sm" variant="outline" disabled title="Not implemented yet">
      Active / Inactive
    </Button>
  ) : undefined;

  async function handleReject(meta: ApprovalMeta) {
    if (definition === null) {
      // Not reviewed — POST via dialog
      setRejectMeta(meta);
    } else {
      // Has existing definition — PUT with is_accepted: false
      try {
        await updateUiBlockDefinition(definition.id, { is_accepted: false });
        toast.success("UI block definition rejected.");
        fetchDefinition();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    }
  }

  return (
    <>
      <UIBlockPreviewPage
        uiBlockKey={uiBlockKey ?? ""}
        actionSlot={actionSlot}
        onApprove={!isAccepted ? (meta) => setApprovalMeta(meta) : undefined}
        onReject={!isAccepted ? handleReject : undefined}
      />

      {approvalMeta && (
        <ApproveUiBlockDialog
          open={!!approvalMeta}
          onOpenChange={(open) => { if (!open) setApprovalMeta(null); }}
          blockKey={approvalMeta.key}
          blockName={approvalMeta.name}
          blockDescription={approvalMeta.description}
          blockSchema={approvalMeta.schema}
          blockDefaults={approvalMeta.defaults}
        />
      )}

      {rejectMeta && (
        <RejectUiBlockDialog
          open={!!rejectMeta}
          onOpenChange={(open) => {
            if (!open) {
              setRejectMeta(null);
              fetchDefinition();
            }
          }}
          blockKey={rejectMeta.key}
          blockName={rejectMeta.name}
          blockDescription={rejectMeta.description}
          blockSchema={rejectMeta.schema}
          blockDefaults={rejectMeta.defaults}
        />
      )}
    </>
  );
}
