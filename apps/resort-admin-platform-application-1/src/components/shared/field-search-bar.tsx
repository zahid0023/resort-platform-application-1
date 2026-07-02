import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@resort/shadcn-ui";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resort/shadcn-ui";

export interface SearchFieldOption {
  value: string;
  label: string;
}

export interface FieldSearchBarProps {
  fields: SearchFieldOption[];
  searchField: string;
  onSearchFieldChange: (field: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  placeholder?: string;
}

export function FieldSearchBar({
  fields,
  searchField,
  onSearchFieldChange,
  search,
  onSearchChange,
  placeholder,
}: FieldSearchBarProps) {
  const { t } = useTranslation();
  const activeLabel = fields.find((f) => f.value === searchField)?.label ?? searchField;
  const inputPlaceholder = placeholder ?? `${t("common.search")} ${activeLabel}…`;

  return (
    <div className="flex items-center w-full">
      <Select value={searchField} onValueChange={onSearchFieldChange}>
        <SelectTrigger className="w-32 sm:w-36 shrink-0 rounded-r-none border-r-0 bg-muted text-foreground focus:ring-0 focus:ring-offset-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {fields.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      <div className="relative flex-1 sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={inputPlaceholder}
          className="pl-9 pr-9 w-full rounded-l-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
