import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, Label, Switch } from "@resort/shadcn-ui";
import type { ConfigFieldRow } from "./types";

// A config field's `default_value` is always stored as a string on the schema (see ConfigFieldRow),
// regardless of `field_type` — this fills a fresh draft from either the config's existing values or
// each field's configured default.
export function buildDraftValues(fields: ConfigFieldRow[], config: Record<string, unknown>): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};
  for (const field of fields) {
    const raw = config[field.key];
    if (field.field_type === "BOOLEAN") {
      values[field.key] = typeof raw === "boolean" ? raw : raw != null ? Boolean(raw) : false;
    } else {
      values[field.key] = raw != null ? String(raw) : field.default_value;
    }
  }
  return values;
}

export interface ConfigValueFieldProps {
  field: ConfigFieldRow;
  value: string | boolean;
  disabled: boolean;
  onChange: (v: string | boolean) => void;
}

// One input per config field, typed off `field.field_type` — mirrors how ConfigFieldFields renders
// the schema itself, except this renders a *value* against that schema rather than the schema fields.
export function ConfigValueField({ field, value, disabled, onChange }: ConfigValueFieldProps) {
  if (field.field_type === "BOOLEAN") {
    return (
      <div className="flex items-center justify-between pt-1">
        <Label className="text-xs text-muted-foreground">{field.label}</Label>
        <Switch checked={!!value} onCheckedChange={onChange} disabled={disabled} />
      </div>
    );
  }

  if (field.field_type === "PASSWORD") {
    return <ConfigPasswordField field={field} value={value as string} disabled={disabled} onChange={onChange} />;
  }

  const inputType = field.field_type === "NUMBER" ? "number" : field.field_type === "URL" ? "url" : "text";

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{field.label} {field.is_required && !disabled && "*"}</Label>
      <Input
        type={inputType}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || undefined}
        disabled={disabled}
        className="h-9 text-sm"
      />
    </div>
  );
}

interface ConfigPasswordFieldProps {
  field: ConfigFieldRow;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}

// The reveal toggle only appears once the field actually has a value to show — an empty
// PASSWORD input has nothing to reveal, so the button stays hidden until there's input.
function ConfigPasswordField({ field, value, disabled, onChange }: ConfigPasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const hasValue = value.trim() !== "";

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{field.label} {field.is_required && !disabled && "*"}</Label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || undefined}
          disabled={disabled}
          className={hasValue ? "h-9 text-sm pr-9" : "h-9 text-sm"}
        />
        {hasValue && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
