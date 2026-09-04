import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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

interface CategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (name: string) => void;
    onDelete?: (id: string) => void;
    editingCat?: MenuCategory | null;
}

export function CategoryDialog({
    open,
    onOpenChange,
    onSave,
    onDelete,
    editingCat,
}: CategoryDialogProps) {
    const [name, setName] = useState("");

    useEffect(() => {
        if (open) {
            setName(editingCat?.name ?? "");
        }
    }, [open, editingCat]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        {editingCat ? "Edit Category" : "Add Category"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingCat
                            ? "Update the category name."
                            : "Create a new category for menu items."}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Category name"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && name.trim())
                                    onSave(name.trim());
                                if (e.key === "Escape") onOpenChange(false);
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        {editingCat && onDelete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    onDelete(editingCat.id);
                                    onOpenChange(false);
                                }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (name.trim()) onSave(name.trim());
                                }}
                                disabled={!name.trim()}>
                                {editingCat ? "Update" : "Create"}
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
