import { List, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MenuCategory } from "@/features/menu/types";
import { pluralize } from "@/utils/format";

interface ManageCategoriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: MenuCategory[];
    itemCounts: Record<string, number>;
    onRename: (id: string, name: string) => void;
    onDelete: (id: string) => void;
    onSave: (name: string) => void;
}

export function ManageCategoriesDialog({
    open,
    onOpenChange,
    categories,
    itemCounts,
    onRename,
    onDelete,
    onSave,
}: ManageCategoriesDialogProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [newName, setNewName] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<MenuCategory | null>(null);
    const [showNewInput, setShowNewInput] = useState(false);

    function handleUpdate(id: string) {
        if (!editName.trim()) return;
        onRename(id, editName.trim());
        setEditingId(null);
        setEditName("");
    }

    function handleCreate() {
        if (!newName.trim()) return;
        onSave(newName.trim());
        setNewName("");
        setShowNewInput(false);
    }

    function handleDelete() {
        if (!deleteTarget) return;
        onDelete(deleteTarget.id);
        setDeleteTarget(null);
    }

    function startEdit(cat: MenuCategory) {
        setEditingId(cat.id);
        setEditName(cat.name);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditName("");
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Manage Categories</DialogTitle>
                        <DialogDescription>
                            Create, rename, or delete categories. Deleting a
                            category will not remove menu items — they will just
                            be ungrouped.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-3">
                        {categories.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                                <List className="size-8" />
                                <p>No categories yet.</p>
                            </div>
                        ) : (
                            categories.map((cat) => {
                                const count = itemCounts[cat.id] ?? 0;
                                return (
                                    <div
                                        key={cat.id}
                                        className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/40">
                                        {editingId === cat.id ? (
                                            <div className="flex flex-1 items-center gap-2">
                                                <div className="flex-1">
                                                    <Label className="sr-only">
                                                        Category name
                                                    </Label>
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) =>
                                                            setEditName(
                                                                e.target.value,
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                "Enter"
                                                            )
                                                                handleUpdate(
                                                                    cat.id,
                                                                );
                                                            if (
                                                                e.key ===
                                                                "Escape"
                                                            )
                                                                cancelEdit();
                                                        }}
                                                        className="h-8"
                                                        autoFocus
                                                    />
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() =>
                                                        handleUpdate(cat.id)
                                                    }
                                                    disabled={!editName.trim()}>
                                                    Save
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={cancelEdit}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-1 items-center gap-2 min-w-0">
                                                    <span className="text-sm font-medium truncate">
                                                        {cat.name}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="shrink-0 text-[10px] px-1.5 py-0 h-5">
                                                        {pluralize(
                                                            count,
                                                            "item",
                                                        )}
                                                    </Badge>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-0.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() =>
                                                            startEdit(cat)
                                                        }
                                                        title="Rename">
                                                        <Pencil />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon-sm"
                                                        onClick={() =>
                                                            setDeleteTarget(cat)
                                                        }
                                                        title="Delete">
                                                        <Trash2 />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        )}

                        <div className="border-t pt-3 mt-1">
                            {showNewInput ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <Label className="sr-only">
                                            New category name
                                        </Label>
                                        <Input
                                            value={newName}
                                            onChange={(e) =>
                                                setNewName(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    handleCreate();
                                                if (e.key === "Escape") {
                                                    setShowNewInput(false);
                                                    setNewName("");
                                                }
                                            }}
                                            placeholder="Category name"
                                            className="h-8"
                                            autoFocus
                                        />
                                    </div>
                                    <Button
                                        size="sm"
                                        className="h-8"
                                        onClick={handleCreate}
                                        disabled={!newName.trim()}>
                                        Create
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => {
                                            setShowNewInput(false);
                                            setNewName("");
                                        }}>
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setShowNewInput(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Category
                                </Button>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title="Delete Category"
                description={
                    deleteTarget && (itemCounts[deleteTarget.id] ?? 0) > 0 ? (
                        <span>
                            Are you sure you want to delete{" "}
                            <strong>{deleteTarget.name}</strong>?
                            <span className="mt-1 block text-destructive">
                                {itemCounts[deleteTarget.id]} menu item(s) will
                                lose this category.
                            </span>
                        </span>
                    ) : (
                        <span>
                            Are you sure you want to delete{" "}
                            <strong>{deleteTarget?.name}</strong>?
                        </span>
                    )
                }
                confirmLabel="Delete"
                onConfirm={handleDelete}
            />
        </>
    );
}
