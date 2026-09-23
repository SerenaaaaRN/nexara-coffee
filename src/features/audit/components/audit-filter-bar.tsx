import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AUDIT_ACTIONS } from "@/features/audit/types";
import { formatActionLabel } from "@/features/audit/utils";
import { formatLabel } from "@/utils/format";

const ACTION_OPTIONS = AUDIT_ACTIONS.map((a) => ({
    value: a,
    label: formatActionLabel(a),
}));

interface AuditFilterBarProps {
    search: string;
    onSearchChange: (v: string) => void;
    actionFilter: string;
    onActionFilterChange: (v: string) => void;
    tableFilter: string;
    onTableFilterChange: (v: string) => void;
    uniqueTables: string[];
    filteredCount: number;
    totalCount: number;
}

export const AuditFilterBar = ({
    search,
    onSearchChange,
    actionFilter,
    onActionFilterChange,
    tableFilter,
    onTableFilterChange,
    uniqueTables,
    filteredCount,
    totalCount,
}: AuditFilterBarProps) => {
    const hasFilters = !!(
        search ||
        actionFilter !== "all" ||
        tableFilter !== "all"
    );

    const clearAll = () => {
        onSearchChange("");
        onActionFilterChange("all");
        onTableFilterChange("all");
    };

    return (
        <>
            <div
                data-tour="audit-toolbar"
                className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search actor, branch, or table..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-8 h-9"
                    />
                </div>
                <Select
                    value={actionFilter}
                    onValueChange={(v) => onActionFilterChange(v ?? "all")}
                    items={{
                        all: "All Actions",
                        ...Object.fromEntries(
                            ACTION_OPTIONS.map(({ value, label }) => [
                                value,
                                label,
                            ]),
                        ),
                    }}>
                    <SelectTrigger className="w-36 h-9">
                        <Filter data-icon="inline-start" />
                        <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="all">All Actions</SelectItem>
                            {ACTION_OPTIONS.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Select
                    value={tableFilter}
                    onValueChange={(v) => onTableFilterChange(v ?? "all")}
                    items={{
                        all: "All Tables",
                        ...Object.fromEntries(
                            uniqueTables.map((t) => [t, formatLabel(t)]),
                        ),
                    }}>
                    <SelectTrigger className="w-44 h-9">
                        <SelectValue placeholder="All tables" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="all">All Tables</SelectItem>
                            {uniqueTables.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {formatLabel(t)}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                {hasFilters ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9"
                        onClick={clearAll}>
                        <X data-icon="inline-start" />
                        Clear
                    </Button>
                ) : null}
            </div>

            {hasFilters ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="tabular-nums font-medium text-foreground">
                        {filteredCount}
                    </span>{" "}
                    of <span className="tabular-nums">{totalCount}</span>{" "}
                    results
                </div>
            ) : null}
        </>
    );
};
