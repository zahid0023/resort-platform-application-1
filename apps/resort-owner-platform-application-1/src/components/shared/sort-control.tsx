import { ArrowDown, ArrowUp } from "lucide-react"
import { Button, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@resort/shadcn-ui"

export interface SortField {
  value: string
  label: string
}

export interface SortControlProps {
  fields: SortField[]
  sortBy: string
  onSortByChange: (value: string) => void
  sortDir: "ASC" | "DESC"
  onSortDirChange: (dir: "ASC" | "DESC") => void
}

export function SortControl({ fields, sortBy, onSortByChange, sortDir, onSortDirChange }: SortControlProps) {
  return (
    <div className="flex items-center w-full">
      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="flex-1 min-w-0 rounded-r-none border-r-0 bg-muted text-foreground focus:ring-0 focus:ring-offset-0">
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
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-l-none shrink-0 border-l-0"
        onClick={() => onSortDirChange(sortDir === "ASC" ? "DESC" : "ASC")}
        title={sortDir === "ASC" ? "Ascending" : "Descending"}
      >
        {sortDir === "ASC"
          ? <ArrowUp className="h-4 w-4" />
          : <ArrowDown className="h-4 w-4" />}
      </Button>
    </div>
  )
}
