import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyDescription,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { BranchDetail } from "@/features/branches/components/branch-detail";
import { BranchFormDialog } from "@/features/branches/components/branch-form-dialog";
import { BranchListPanel } from "@/features/branches/components/branch-list-panel";
import {
    useCreateBranch,
    useDeleteBranch,
    useUpdateBranch,
} from "@/features/branches/hooks/useBranchMutations";
import { useBranches } from "@/features/branches/hooks/useBranchQueries";
import type { CreateBranchInput } from "@/features/branches/types";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/utils/cn";

const routeApi = getRouteApi("/_dashboard/branches");

export const BranchesPage = () => {
    const { branch } = routeApi.useSearch();
    const navigate = useNavigate();
    const [createOpen, setCreateOpen] = useState(false);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const q = debouncedSearch.trim();
    const { data } = useBranches(q ? { q } : undefined);

    const branches = data.success ? data.data : [];
    const filtered = branches;

    const createBranch = useCreateBranch();
    const updateBranch = useUpdateBranch();
    const deleteBranch = useDeleteBranch();

    const selectedBranch = branch
        ? (branches.find((b) => b.id === branch) ?? null)
        : null;

    const onSelect = (id: string | null) => {
        navigate({
            to: ".",
            search: { branch: id ?? undefined },
            replace: true,
        });
    };

    const handleCreate = async (data: CreateBranchInput) => {
        try {
            await createBranch.mutateAsync(data);
            toast.success("Branch created");
            setCreateOpen(false);
        } catch {
            toast.error("Failed to create branch");
        }
    };

    const handleEdit = async (data: CreateBranchInput) => {
        if (!selectedBranch) return;
        try {
            await updateBranch.mutateAsync({ id: selectedBranch.id, ...data });
            toast.success("Branch updated");
        } catch {
            toast.error("Failed to update branch");
        }
    };

    const handleDelete = async (branchId: string) => {
        await deleteBranch.mutateAsync(branchId);
    };

    return (
        <div className="flex flex-1 flex-col min-h-0 gap-6">
            <SectionHeader
                title="Branches"
                subtitle="Manage cafe branches and franchise owners."
            />

            <div className="flex min-h-0 flex-1 flex-col-reverse gap-0 overflow-hidden rounded-lg border md:flex-row md:gap-px">
                <div
                    className={cn(
                        "flex min-h-0 flex-1 flex-col",
                        !selectedBranch ? "hidden md:flex" : null,
                    )}>
                    {selectedBranch ? (
                        <>
                            <div className="flex items-center gap-2 border-b px-4 py-2 md:hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onSelect(null)}>
                                    <ArrowLeft className="size-4" />
                                </Button>
                                <span className="text-sm font-medium">
                                    {selectedBranch.name}
                                </span>
                            </div>
                            <div className="flex min-h-0 flex-1 overflow-y-auto scrollbar-gutter-stable">
                                <BranchDetail
                                    branch={selectedBranch}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center p-6">
                            <Empty>
                                <EmptyMedia variant="icon">
                                    <Building2 />
                                </EmptyMedia>
                                <EmptyTitle>Select a branch</EmptyTitle>
                                <EmptyDescription>
                                    Choose a branch from the list to view its
                                    details.
                                </EmptyDescription>
                            </Empty>
                        </div>
                    )}
                </div>

                <BranchListPanel
                    branches={filtered}
                    selectedId={branch}
                    search={search}
                    hidden={!!selectedBranch}
                    onSearchChange={setSearch}
                    onSelect={onSelect}
                    onAdd={() => setCreateOpen(true)}
                />

                <BranchFormDialog
                    key="branch-create"
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onSubmit={handleCreate}
                />
            </div>
        </div>
    );
};
