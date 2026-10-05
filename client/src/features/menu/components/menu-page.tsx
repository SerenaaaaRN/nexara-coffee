import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, List, Pencil, Plus, Soup, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionHeader } from "#/components/shared/section-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
    Empty,
    EmptyDescription,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useCreateCategory,
    useDeleteCategory,
    useUpdateCategory,
} from "@/features/menu/hooks/useCategoryMutations";
import {
    useCreateMenuItem,
    useDeleteMenuItem,
    useToggleAvailability,
    useUpdateMenuItem,
} from "@/features/menu/hooks/useItemMutations";
import {
    useMenuCategories,
    useMenuItems,
} from "@/features/menu/hooks/useMenuQueries";
import type { MenuCategory, MenuItemRow } from "@/features/menu/types";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { formatCurrency, pluralize } from "@/utils/format";
import { getBadgeVariant, getStatusLabel } from "@/utils/status";
import { CategoryDialog } from "./category-dialog";
import { ManageCategoriesDialog } from "./manage-categories-dialog";
import { MenuFormDialog } from "./menu-form-dialog";

const routeApi = getRouteApi("/_dashboard/menu");

function ItemGrid({
    items,
    onEdit,
    onDelete,
    onToggle,
}: {
    items: MenuItemRow[];
    onEdit: (item: MenuItemRow) => void;
    onDelete: (item: MenuItemRow) => void;
    onToggle: (id: string, current: boolean) => void;
}) {
    if (items.length === 0) {
        return (
            <Empty>
                <EmptyMedia>
                    <Soup />
                </EmptyMedia>
                <EmptyTitle>No menu items</EmptyTitle>
                <EmptyDescription>
                    Add your first menu item to get started.
                </EmptyDescription>
            </Empty>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
                const variants = item.variants as
                    | { name: string; price: number }[]
                    | null;
                return (
                    <Card key={item.id} className="group">
                        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center text-muted-foreground">
                                    <Soup className="size-10" />
                                </div>
                            )}
                        </div>
                        <CardContent className="flex flex-col gap-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold leading-none">
                                    {item.name}
                                </h3>
                                <Badge
                                    variant={getBadgeVariant(
                                        item.isAvailable
                                            ? "available"
                                            : "hidden",
                                    )}>
                                    {getStatusLabel(
                                        item.isAvailable
                                            ? "available"
                                            : "hidden",
                                    )}
                                </Badge>
                            </div>
                            <p className="font-mono text-sm font-medium text-primary">
                                {formatCurrency(item.price)}
                            </p>
                            {item.description && (
                                <p className="text-muted-foreground line-clamp-2 text-xs">
                                    {item.description}
                                </p>
                            )}
                            {variants?.length ? (
                                <span className="text-muted-foreground mt-auto text-xs">
                                    {pluralize(variants.length, "variant")}
                                </span>
                            ) : null}
                        </CardContent>
                        <CardFooter className="justify-end gap-0.5">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() =>
                                    onToggle(item.id, item.isAvailable)
                                }
                                title={item.isAvailable ? "Hide" : "Show"}>
                                {item.isAvailable ? <EyeOff /> : <Eye />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onEdit(item)}
                                title="Edit">
                                <Pencil />
                            </Button>
                            <Button
                                variant="destructive"
                                size="icon-sm"
                                onClick={() => onDelete(item)}
                                title="Delete">
                                <Trash2 />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}

export function MenuPage() {
    const { category } = routeApi.useSearch();
    const navigate = useNavigate();
    const { data: catData } = useMenuCategories();
    const { data: itemData } = useMenuItems(category);

    const categories = catData.success ? catData.data : [];
    const items = itemData?.success ? itemData.data : [];
    const activeTab = category ?? "all";

    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [catDialogOpen, setCatDialogOpen] = useState(false);
    const [manageCatOpen, setManageCatOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItemRow | null>(null);
    const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);

    const createItem = useCreateMenuItem();
    const updateItem = useUpdateMenuItem();
    const deleteItem = useDeleteMenuItem();
    const toggleAvail = useToggleAvailability();
    const createCat = useCreateCategory();
    const updateCat = useUpdateCategory();
    const deleteCat = useDeleteCategory();

    const deleteConfirm = useConfirmAction<MenuItemRow>();

    const itemCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const item of items) {
            counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1;
        }
        return counts;
    }, [items]);

    const handleTabChange = (tab: string) => {
        navigate({
            to: ".",
            search: (prev) => ({
                ...prev,
                category: tab === "all" ? undefined : tab,
            }),
            replace: true,
        });
    };
    const handleCreateItem = async (data: Record<string, unknown>) => {
        try {
            await createItem.mutateAsync(
                data as Parameters<typeof createItem.mutate>[0],
            );
            toast.success("Menu item created");
            setItemDialogOpen(false);
        } catch {
            toast.error("Failed to create menu item");
        }
    };

    const handleUpdateItem = async (data: Record<string, unknown>) => {
        if (!editingItem) return;
        try {
            await updateItem.mutateAsync({
                ...data,
                id: editingItem.id,
            } as Parameters<typeof updateItem.mutate>[0]);
            toast.success("Menu item updated");
            setEditingItem(null);
            setItemDialogOpen(false);
        } catch {
            toast.error("Failed to update menu item");
        }
    };

    const handleDeleteItem = async () => {
        if (!deleteConfirm.target) return;
        try {
            await deleteItem.mutateAsync(deleteConfirm.target.id);
            toast.success("Menu item deleted");
            deleteConfirm.clearTarget();
        } catch {
            toast.error("Failed to delete menu item");
        }
    };

    const handleToggle = async (id: string, current: boolean) => {
        try {
            await toggleAvail.mutateAsync({ id, isAvailable: !current });
            toast.success(current ? "Item hidden" : "Item shown");
        } catch {
            toast.error("Failed to toggle availability");
        }
    };

    const handleCreateCat = async (name: string) => {
        try {
            await createCat.mutateAsync({ name });
            toast.success("Category created");
            setCatDialogOpen(false);
        } catch {
            toast.error("Failed to create category");
        }
    };

    const handleUpdateCat = async (name: string) => {
        if (!editingCat) return;
        try {
            await updateCat.mutateAsync({ id: editingCat.id, name });
            toast.success("Category updated");
            setEditingCat(null);
            setCatDialogOpen(false);
        } catch {
            toast.error("Failed to update category");
        }
    };

    const handleDeleteCat = async (id: string) => {
        try {
            const result = await deleteCat.mutateAsync(id);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success("Category deleted");
            setCatDialogOpen(false);
        } catch {
            toast.error("Failed to delete category");
        }
    };

    const handleRenameCat = async (id: string, name: string) => {
        try {
            await updateCat.mutateAsync({ id, name });
            toast.success("Category renamed");
        } catch {
            toast.error("Failed to rename category");
        }
    };

    const handleCatDeleteInManage = async (id: string) => {
        try {
            const result = await deleteCat.mutateAsync(id);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success("Category deleted");
        } catch {
            toast.error("Failed to delete category");
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Menu"
                subtitle="Manage menu items and categories"
            />

            <div className="flex flex-1 flex-col gap-4">
                <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Total Items" value={items.length} />
                    <StatCard
                        label="Available"
                        value={items.filter((i) => i.isAvailable).length}
                    />
                    <StatCard
                        label="Hidden"
                        value={items.filter((i) => !i.isAvailable).length}
                    />
                    <StatCard label="Categories" value={categories.length} />
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <TabsList className="flex-wrap">
                            <TabsTrigger value="all">
                                All ({items.length})
                            </TabsTrigger>
                            {categories.map((cat) => (
                                <TabsTrigger key={cat.id} value={cat.id}>
                                    {cat.name} ({itemCounts[cat.id] ?? 0})
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setManageCatOpen(true)}>
                                <List className="mr-2 h-4 w-4" /> Manage
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditingCat(null);
                                    setCatDialogOpen(true);
                                }}>
                                <Plus className="mr-2 h-4 w-4" /> Add Category
                            </Button>
                            <Button
                                onClick={() => {
                                    setEditingItem(null);
                                    setItemDialogOpen(true);
                                }}>
                                <Plus className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                        </div>
                    </div>

                    <TabsContent value="all" className="mt-4">
                        <ItemGrid
                            items={items}
                            onEdit={(item) => {
                                setEditingItem(item);
                                setItemDialogOpen(true);
                            }}
                            onDelete={(item) => deleteConfirm.setTarget(item)}
                            onToggle={handleToggle}
                        />
                    </TabsContent>

                    {categories.map((cat) => (
                        <TabsContent
                            key={cat.id}
                            value={cat.id}
                            className="mt-4">
                            <ItemGrid
                                items={items.filter(
                                    (i) => i.categoryId === cat.id,
                                )}
                                onEdit={(item) => {
                                    setEditingItem(item);
                                    setItemDialogOpen(true);
                                }}
                                onDelete={(item) =>
                                    deleteConfirm.setTarget(item)
                                }
                                onToggle={handleToggle}
                            />
                        </TabsContent>
                    ))}
                </Tabs>

                <MenuFormDialog
                    open={itemDialogOpen}
                    onOpenChange={(open) => {
                        setItemDialogOpen(open);
                        if (!open) setEditingItem(null);
                    }}
                    categories={categories}
                    editingItem={editingItem}
                    onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
                />

                <CategoryDialog
                    open={catDialogOpen}
                    onOpenChange={(open) => {
                        setCatDialogOpen(open);
                        if (!open) setEditingCat(null);
                    }}
                    editingCat={editingCat}
                    onSave={editingCat ? handleUpdateCat : handleCreateCat}
                    onDelete={handleDeleteCat}
                />

                <ManageCategoriesDialog
                    open={manageCatOpen}
                    onOpenChange={setManageCatOpen}
                    categories={categories}
                    itemCounts={itemCounts}
                    onSave={handleCreateCat}
                    onRename={handleRenameCat}
                    onDelete={handleCatDeleteInManage}
                />

                <ConfirmDialog
                    {...deleteConfirm.dialogProps}
                    title="Delete Menu Item"
                    description={
                        <>
                            Are you sure you want to delete{" "}
                            <strong>{deleteConfirm.target?.name}</strong>? This
                            action cannot be undone.
                        </>
                    }
                    confirmLabel="Delete"
                    onConfirm={handleDeleteItem}
                />
            </div>
        </div>
    );
}
