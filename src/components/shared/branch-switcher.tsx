import { useNavigate, useSearch } from "@tanstack/react-router";

type AnySearch = Record<string, string | undefined>;

import { useCallback, useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useBranchStore } from "@/stores/branch";

interface Branch {
    id: string;
    name: string;
}

interface BranchSwitcherProps {
    branches: Branch[];
    isSuperAdmin: boolean;
    defaultBranchId?: string | null;
}

export function BranchSwitcher({
    branches,
    isSuperAdmin,
    defaultBranchId,
}: BranchSwitcherProps) {
    const navigate = useNavigate();
    const currentSearch = useSearch({ strict: false }) as AnySearch;
    const { activeBranch, setActiveBranch } = useBranchStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: <Zustand on mount>
    useEffect(() => {
        const urlBranch = currentSearch.branch || null;
        const initial = urlBranch ?? defaultBranchId ?? null;
        if (activeBranch !== initial) {
            setActiveBranch(initial);
        }
    }, []);

    const handleChange = useCallback(
        (val: string | null) => {
            const next = val || null;
            setActiveBranch(next);

            navigate({
                search: ((prev: Record<string, string | undefined>) => {
                    const nextSearch = { ...prev };
                    if (next) {
                        nextSearch.branch = next;
                    } else {
                        delete nextSearch.branch;
                    }
                    return nextSearch;
                }) as never,
                replace: true,
            });
        },
        [navigate, setActiveBranch],
    );

    if (!mounted) return null;

    return (
        <Select
            value={activeBranch ?? ""}
            onValueChange={handleChange}
            items={{
                "": "All Branches",
                ...Object.fromEntries(branches.map((b) => [b.id, b.name])),
            }}>
            <SelectTrigger className="w-48">
                <SelectValue
                    placeholder={
                        isSuperAdmin ? "All Branches" : "Select branch"
                    }
                />
            </SelectTrigger>
            <SelectContent>
                {isSuperAdmin && <SelectItem value="">All Branches</SelectItem>}
                {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                        {b.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
