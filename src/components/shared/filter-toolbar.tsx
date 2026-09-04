import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TableState {
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
    getFilterValue: (columnId: string) => string | undefined;
    setFilterValue: (
        columnId: string,
        value: string | undefined | null,
    ) => void;
    clearAll: () => void;
}

interface FilterConfig {
    columnId: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    width?: string;
}

interface FilterToolbarProps {
    tableState: TableState;
    searchPlaceholder?: string;
    filters?: FilterConfig[];
    total?: number;
    filtered?: number;
    children?: ReactNode;
}

export function FilterToolbar({
    tableState,
    searchPlaceholder,
    filters,
    total,
    filtered,
    children,
}: FilterToolbarProps) {
    const hasActiveFilters =
        tableState.globalFilter !== "" ||
        filters?.some(
            (f) => tableState.getFilterValue(f.columnId) !== undefined,
        );

    return (
        <div className="flex flex-wrap items-center gap-3">
            {children}

            {searchPlaceholder !== undefined && (
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={tableState.globalFilter}
                        onChange={(e) =>
                            tableState.setGlobalFilter(e.target.value)
                        }
                        className="pl-8"
                    />
                </div>
            )}

            {filters?.map((f) => {
                const value = tableState.getFilterValue(f.columnId) ?? "all";
                const allOptions = [
                    { value: "all", label: f.placeholder ?? "All" },
                    ...f.options,
                ];
                return (
                    <Select
                        key={f.columnId}
                        value={value}
                        onValueChange={(v) =>
                            tableState.setFilterValue(
                                f.columnId,
                                v === null || v === "all" ? null : v,
                            )
                        }
                        items={Object.fromEntries(
                            allOptions.map((o) => [o.value, o.label]),
                        )}>
                        <SelectTrigger className={f.width ?? "w-36"}>
                            <SelectValue placeholder={f.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {allOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            })}

            {total !== undefined && filtered !== undefined && (
                <span className="text-sm text-muted-foreground">
                    {filtered} of {total}
                </span>
            )}

            {hasActiveFilters && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={tableState.clearAll}>
                    <X data-icon="inline-start" />
                    Clear filters
                </Button>
            )}
        </div>
    );
}
