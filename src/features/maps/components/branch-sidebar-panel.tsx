import {
    Building2,
    ChevronDown,
    ChevronUp,
    MapPin,
    Search,
    Store,
} from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BranchMarker } from "@/features/maps/types";

export type ParsedBranch = BranchMarker & {
    numericLat: number;
    numericLng: number;
};

type BranchSidebarPanelProps = {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isListOpen: boolean;
    onToggleList: () => void;
    filteredBranches: ParsedBranch[];
    activeMarkerId: string | null;
    onSelectBranch: (branch: ParsedBranch) => void;
};

export const BranchSidebarPanel = memo(
    ({
        searchQuery,
        onSearchChange,
        isListOpen,
        onToggleList,
        filteredBranches,
        activeMarkerId,
        onSelectBranch,
    }: BranchSidebarPanelProps) => {
        const [localQuery, setLocalQuery] = useState(searchQuery);
        const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        useEffect(() => {
            setLocalQuery(searchQuery);
        }, [searchQuery]);

        useEffect(() => {
            return () => {
                if (debounceRef.current) clearTimeout(debounceRef.current);
            };
        }, []);

        const handleInputChange = (value: string) => {
            setLocalQuery(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                onSearchChange(value);
            }, 300);
        };
        return (
            <>
                <div
                    data-tour="maps-search"
                    className="absolute left-2 top-2 z-10 flex w-[calc(100%-1rem)] flex-col gap-2 md:left-4 md:top-4 md:w-80">
                    <div className="flex items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-lg backdrop-blur">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search branch..."
                                className="h-9 border-none bg-transparent pl-9 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                value={localQuery}
                                onChange={(e) =>
                                    handleInputChange(e.target.value)
                                }
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-muted-foreground"
                            onClick={onToggleList}
                            title={isListOpen ? "Hide list" : "Show list"}>
                            {isListOpen ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {isListOpen ? (
                        <div className="flex max-h-[calc(100vh-16rem)] flex-col overflow-y-auto rounded-lg border bg-background/95 p-2 shadow-lg backdrop-blur">
                            <div className="mb-2 px-2 pt-1 text-xs font-semibold text-muted-foreground">
                                {filteredBranches.length} branches found
                            </div>
                            <div className="flex flex-col gap-1.5 pr-1">
                                {filteredBranches.length === 0 ? (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <MapPin className="mx-auto mb-2 h-6 w-6 opacity-20" />
                                        <p className="text-xs">
                                            No branches found.
                                        </p>
                                    </div>
                                ) : (
                                    filteredBranches.map((branch) => {
                                        const isActive =
                                            activeMarkerId === branch.id;
                                        const isCorporate =
                                            branch.ownershipType ===
                                            "corporate";
                                        const isActiveStatus =
                                            branch.status === "active";

                                        return (
                                            <button
                                                type="button"
                                                key={branch.id}
                                                className={`w-full cursor-pointer rounded-md p-3 text-left transition-colors hover:bg-muted ${
                                                    isActive
                                                        ? "bg-muted shadow-sm ring-1 ring-border"
                                                        : "bg-transparent"
                                                }`}
                                                onClick={() =>
                                                    onSelectBranch(branch)
                                                }>
                                                <div className="text-sm font-medium leading-tight text-foreground">
                                                    {branch.name}
                                                </div>
                                                <div className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                                                    {branch.address}
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                        {isCorporate ? (
                                                            <Store className="h-3 w-3 text-blue-500" />
                                                        ) : (
                                                            <Building2 className="h-3 w-3 text-orange-500" />
                                                        )}
                                                        <span className="capitalize">
                                                            {
                                                                branch.ownershipType
                                                            }
                                                        </span>
                                                    </div>
                                                    <Badge
                                                        variant={
                                                            isActiveStatus
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                        className="px-1.5 py-0 text-[9px]">
                                                        {branch.status}
                                                    </Badge>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                <div
                    data-tour="maps-legend"
                    className="pointer-events-none absolute right-4 top-4 z-10 rounded-md border bg-background/90 p-2 shadow-sm backdrop-blur md:right-6 md:top-6">
                    <div className="mb-1.5 px-1 text-xs font-semibold">
                        Legend
                    </div>
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2 px-1">
                            <div className="h-3 w-3 shrink-0 rounded-full border border-white bg-blue-500" />
                            <span>Corporate Branch</span>
                        </div>
                        <div className="flex items-center gap-2 px-1">
                            <div className="h-3 w-3 shrink-0 rounded-full border border-white bg-orange-500" />
                            <span>Franchise Partner</span>
                        </div>
                    </div>
                </div>
            </>
        );
    },
);
