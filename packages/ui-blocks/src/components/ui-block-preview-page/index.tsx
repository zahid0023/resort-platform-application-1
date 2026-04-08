"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { UI_BLOCKS_INDEX, type EditableProp, type UiBlockMeta } from "../../registry";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Monitor, Smartphone, Tablet, RotateCcw, ChevronDown } from "lucide-react";

type ApprovalMeta = Pick<UiBlockMeta, "key" | "name" | "description" | "schema" | "defaults">;

type Viewport = "mobile" | "tablet" | "laptop";

const VIEWPORTS: { key: Viewport; label: string; width: string; icon: ReactNode }[] = [
  { key: "mobile", label: "Mobile", width: "375px", icon: <Smartphone className="h-4 w-4" /> },
  { key: "tablet", label: "Tablet", width: "768px", icon: <Tablet className="h-4 w-4" /> },
  { key: "laptop", label: "Laptop", width: "100%", icon: <Monitor className="h-4 w-4" /> },
];

interface UIBlockPreviewPageProps {
  uiBlockKey: string;
  onApprove?: (meta: ApprovalMeta) => void;
  onReject?: (meta: ApprovalMeta) => void;
  actionSlot?: ReactNode;
}

function PropField({
  prop,
  value,
  onChange,
}: {
  prop: EditableProp;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
}) {
  const id = `prop-${prop.name}`;

  if (prop.type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(prop.name, e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <Label htmlFor={id}>{prop.label}</Label>
      </div>
    );
  }

  if (prop.type === "select") {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{prop.label}</Label>
        <select
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(prop.name, e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {prop.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (prop.type === "color") {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{prop.label}</Label>
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="color"
            value={String(value ?? "#000000")}
            onChange={(e) => onChange(prop.name, e.target.value)}
            className="h-10 w-10 cursor-pointer rounded-md border border-input bg-background p-1"
          />
          <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(prop.name, e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
    );
  }

  if (prop.type === "number") {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{prop.label}</Label>
        <Input
          id={id}
          type="number"
          value={String(value ?? "")}
          onChange={(e) => onChange(prop.name, e.target.valueAsNumber)}
        />
      </div>
    );
  }

  // string (default)
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{prop.label}</Label>
      <Input
        id={id}
        type="text"
        value={String(value ?? "")}
        onChange={(e) => onChange(prop.name, e.target.value)}
      />
    </div>
  );
}

export function UIBlockPreviewPage({ uiBlockKey, onApprove, onReject, actionSlot }: UIBlockPreviewPageProps) {
  const [viewport, setViewport] = useState<Viewport>("laptop");
  const uiBlock = UI_BLOCKS_INDEX.find((b) => b.key === uiBlockKey);
  const [props, setProps] = useState<Record<string, unknown>>(() => ({ ...uiBlock?.defaults }));
  const [reviewOpen, setReviewOpen] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reviewOpen) return;
    function handleClick(e: MouseEvent) {
      if (reviewRef.current && !reviewRef.current.contains(e.target as Node)) {
        setReviewOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [reviewOpen]);

  if (!uiBlock) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">UI Block &quot;{uiBlockKey}&quot; not found.</p>
      </div>
    );
  }

  const UIBlock = uiBlock.component;
  const activeWidth = VIEWPORTS.find((v) => v.key === viewport)!.width;

  function handlePropChange(name: string, value: unknown) {
    setProps((prev) => ({ ...prev, [name]: value }));
  }

  function handleReset() {
    setProps({ ...uiBlock!.defaults });
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border">
      {/* Row 1: name + description + viewport icons */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <p className="font-semibold leading-tight">{uiBlock.name}</p>
          <p className="text-sm text-muted-foreground">{uiBlock.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {VIEWPORTS.map((v) => (
              <Button
                key={v.key}
                size="sm"
                variant={viewport === v.key ? "default" : "outline"}
                onClick={() => setViewport(v.key)}
              >
                {v.icon}
              </Button>
            ))}
          </div>

          {actionSlot ?? ((onApprove || onReject) && (
            <div className="relative" ref={reviewRef}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReviewOpen((o) => !o)}
                className="flex items-center gap-1"
              >
                Review <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              {reviewOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-md border bg-background shadow-md">
                  {onApprove && (
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        setReviewOpen(false);
                        onApprove({ key: uiBlock!.key, name: uiBlock!.name, description: uiBlock!.description, schema: uiBlock!.schema, defaults: uiBlock!.defaults });
                      }}
                    >
                      Approve
                    </button>
                  )}
                  {onReject && (
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        setReviewOpen(false);
                        onReject({ key: uiBlock!.key, name: uiBlock!.name, description: uiBlock!.description, schema: uiBlock!.schema, defaults: uiBlock!.defaults });
                      }}
                    >
                      Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: preview + edit panel */}
      <div className="flex min-h-full min-w-full flex-1 overflow-hidden">
        {/* Preview area */}
        <div className="flex flex-1 overflow-auto bg-muted/50">
          <div
            className="min-h-full mx-auto bg-background transition-all duration-300"
            style={{ width: activeWidth }}
          >
            <UIBlock {...props} />
          </div>
        </div>

        {/* Edit panel */}
        <div className="flex w-72 flex-col overflow-hidden border-l bg-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold">Edit Props</p>
            <Button size="sm" variant="ghost" onClick={handleReset} title="Reset to defaults">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            {uiBlock.schema.props.map((prop) => (
              <PropField
                key={prop.name}
                prop={prop}
                value={props[prop.name]}
                onChange={handlePropChange}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
