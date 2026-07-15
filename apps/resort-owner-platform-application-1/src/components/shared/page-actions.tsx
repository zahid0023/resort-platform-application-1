import { FieldSearchBar, type FieldSearchBarProps } from "./field-search-bar"
import { SortControl, type SortControlProps } from "./sort-control"
import { NewButton } from "./new-button"

export interface PageActionsProps extends FieldSearchBarProps {
  newLabel: string
  onNew: () => void
  sort?: SortControlProps
}

export function PageActions({ newLabel, onNew, sort, ...searchBarProps }: PageActionsProps) {
  return (
    <div className="grid gap-2">
      <FieldSearchBar {...searchBarProps} />
      <div className="grid grid-cols-2 gap-2">
        {sort && <SortControl {...sort} />}
        <NewButton label={newLabel} onClick={onNew} className="w-full" />
      </div>
    </div>
  )
}
