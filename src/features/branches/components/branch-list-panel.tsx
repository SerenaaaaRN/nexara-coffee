import { Plus, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BranchRow } from "@/features/branches/types";
import { cn } from "@/utils/cn";
import { formatLabel } from "@/utils/format";
import { getBadgeVariant } from "@/utils/status";

interface BranchListPanelProps {
    branches: BranchRow[];
    selectedId: string | undefined;
    search: string;
    hidden: boolean;
    onSearchChange: (v: string) => void;
    onSelect: (id: string) => void;
    onAdd: () => void;
}

export const BranchListPanel = ({
    branches,
    selectedId,
    search,
    hidden,
    onSearchChange,
    onSelect,
    onAdd,
}: BranchListPanelProps) => {
    return (
        <div
            data-tour="branches-list"
            className={cn(
                "flex w-full min-w-0 flex-col overflow-hidden border-b md:w-80 md:border-b-0 md:border-l",
                hidden ? "hidden md:flex" : null,
            )}>
            <div className="flex items-center justify-between border-b px-3 py-2.5">
                <h3 className="text-sm font-medium">Branches</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAdd}
                    data-tour="branches-add">
                    <Plus className="size-3.5" /> Add
                </Button>
            </div>

            <div className="flex min-w-0 min-h-0 flex-1 flex-col">
                <div className="flex-none px-3 py-3">
                    <Input
                        placeholder="Search branches..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-9"
                    />
                </div>

                {branches.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
                        <SearchX className="size-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            No branches found
                        </p>
                    </div>
                ) : (
                    <div className="min-w-0 flex-1 overflow-y-auto px-3 pb-3">
                        <div className="flex flex-col gap-1">
                            {branches.map((b) => (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => onSelect(b.id)}
                                    className={cn(
                                        "flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                        b.id === selectedId
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-muted",
                                    )}>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="min-w-0 truncate font-medium">
                                            {b.name}
                                        </span>
                                        <Badge
                                            variant={getBadgeVariant(b.status)}
                                            className="shrink-0 text-[10px] capitalize">
                                            {formatLabel(b.status)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span className="shrink-0">
                                            {formatLabel(b.ownershipType)}
                                        </span>
                                        <span
                                            className="shrink-0 text-[10px]"
                                            aria-hidden="true">
                                            /
                                        </span>
                                        <span className="min-w-0 truncate">
                                            {b.address}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
