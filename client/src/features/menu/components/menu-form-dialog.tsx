import { ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Field,
    FieldContent,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
    CreateMenuItemInput,
    MenuCategory,
    MenuItemRow,
    MenuItemSubmitData,
} from "@/features/menu/types";
import { createMenuItemSchema } from "@/features/menu/types";
import { useFormDialog } from "@/hooks/useFormDialog";
import { useImageUpload } from "@/hooks/useImageUpload";

interface MenuFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: MenuCategory[];
    editingItem?: MenuItemRow | null;
    onSubmit: (data: MenuItemSubmitData) => Promise<void>;
}

export const MenuFormDialog = ({
    open,
    onOpenChange,
    categories,
    editingItem,
    onSubmit: onSubmitProp,
}: MenuFormDialogProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
        null,
    );

    const {
        previewUrl,
        selectedFile,
        error: uploadError,
        fileInputRef,
        handleThumbnailClick,
        handleFileChange,
        toBase64,
        resetFile,
    } = useImageUpload();

    const { form, resetForm } = useFormDialog(createMenuItemSchema, {
        categoryId: "",
        name: "",
        description: "",
        price: 0,
        variants: [] as { name: string; price: number }[],
    });

    const { register, handleSubmit, formState, watch, setValue, control } =
        form;

    const variants = watch("variants") ?? [];
    const errors = formState.errors;

    useEffect(() => {
        if (!open) return;
        if (editingItem) {
            resetForm({
                categoryId: editingItem.categoryId,
                name: editingItem.name,
                description: editingItem.description ?? "",
                price: Number(editingItem.price),
                variants: (editingItem.variants ?? []) as {
                    name: string;
                    price: number;
                }[],
            });
            setExistingImageUrl(editingItem.imageUrl ?? null);
        } else {
            resetForm();
            setExistingImageUrl(null);
        }
        resetFile();
    }, [open, editingItem, resetForm, resetFile]);

    const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e);
        setExistingImageUrl(null);
    };

    const handleRemove = () => {
        resetFile();
        setExistingImageUrl(null);
    };

    const onFormSubmit = async (values: CreateMenuItemInput) => {
        setIsSubmitting(true);
        try {
            if (selectedFile) {
                const base64 = await toBase64();
                await onSubmitProp({ ...values, imageBase64: base64 });
            } else if (existingImageUrl) {
                await onSubmitProp({ ...values, imageUrl: existingImageUrl });
            } else {
                await onSubmitProp({ ...values, imageUrl: "" });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const addVariant = () => {
        const current = watch("variants") ?? [];
        setValue("variants", [...current, { name: "", price: 0 }]);
    };

    const removeVariant = (index: number) => {
        const current = watch("variants") ?? [];
        setValue(
            "variants",
            current.filter((_, i) => i !== index),
        );
    };

    const displayPreview = previewUrl ?? null;
    const hasImage = !!displayPreview || !!existingImageUrl;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {editingItem ? "Edit Menu Item" : "Add Menu Item"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingItem
                            ? "Update the menu item details below."
                            : "Fill in the details to create a new menu item."}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onFormSubmit)}
                    className="flex flex-col gap-4">
                    <FieldGroup>
                        <div className="grid grid-cols-[1fr_220px] gap-6">
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field data-invalid={!!errors.categoryId}>
                                        <FieldLabel>Category</FieldLabel>
                                        <FieldContent>
                                            <Select
                                                defaultValue=""
                                                onValueChange={(v) =>
                                                    setValue(
                                                        "categoryId",
                                                        v ?? "",
                                                    )
                                                }
                                                items={Object.fromEntries(
                                                    categories.map((cat) => [
                                                        cat.id,
                                                        cat.name,
                                                    ]),
                                                )}>
                                                <SelectTrigger
                                                    aria-invalid={
                                                        !!errors.categoryId
                                                    }
                                                    value={watch("categoryId")}>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {categories.map(
                                                            (cat) => (
                                                                <SelectItem
                                                                    key={cat.id}
                                                                    value={
                                                                        cat.id
                                                                    }>
                                                                    {cat.name}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </FieldContent>
                                    </Field>

                                    <Field data-invalid={!!errors.price}>
                                        <FieldLabel htmlFor="price">
                                            Price (Rp)
                                        </FieldLabel>
                                        <FieldContent>
                                            <Controller
                                                control={control}
                                                name="price"
                                                render={({ field }) => (
                                                    <CurrencyInput
                                                        id="price"
                                                        placeholder="25000"
                                                        aria-invalid={
                                                            !!errors.price
                                                        }
                                                        value={
                                                            field.value as number
                                                        }
                                                        onChange={
                                                            field.onChange
                                                        }
                                                    />
                                                )}
                                            />
                                        </FieldContent>
                                    </Field>
                                </div>

                                <Field data-invalid={!!errors.name}>
                                    <FieldLabel htmlFor="name">Name</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="name"
                                            placeholder="Espresso"
                                            aria-invalid={!!errors.name}
                                            {...register("name")}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field data-invalid={!!errors.description}>
                                    <FieldLabel htmlFor="description">
                                        Description
                                    </FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            id="description"
                                            placeholder="Rich and bold espresso shot"
                                            className="resize-none"
                                            rows={2}
                                            aria-invalid={!!errors.description}
                                            {...register("description")}
                                        />
                                    </FieldContent>
                                </Field>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            Variants
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addVariant}>
                                            + Add Variant
                                        </Button>
                                    </div>
                                    {variants.map((v, idx) => (
                                        <div
                                            key={`${v.name ?? ""}-${idx}`}
                                            className="flex items-end gap-2">
                                            <Field className="flex-1">
                                                <FieldLabel className="text-xs">
                                                    Name
                                                </FieldLabel>
                                                <FieldContent>
                                                    <Input
                                                        placeholder="Large"
                                                        {...register(
                                                            `variants.${idx}.name` as const,
                                                        )}
                                                    />
                                                </FieldContent>
                                            </Field>
                                            <Field className="w-28">
                                                <FieldLabel className="text-xs">
                                                    Price
                                                </FieldLabel>
                                                <FieldContent>
                                                    <Controller
                                                        control={control}
                                                        name={
                                                            `variants.${idx}.price` as const
                                                        }
                                                        render={({ field }) => (
                                                            <CurrencyInput
                                                                placeholder="30000"
                                                                value={
                                                                    field.value as number
                                                                }
                                                                onChange={
                                                                    field.onChange
                                                                }
                                                            />
                                                        )}
                                                    />
                                                </FieldContent>
                                            </Field>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="mb-0.5 shrink-0"
                                                onClick={() =>
                                                    removeVariant(idx)
                                                }>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Field>
                                <FieldLabel>Image</FieldLabel>
                                <FieldContent>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={onFilePick}
                                        className="hidden"
                                    />
                                    {hasImage ? (
                                        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                                            <img
                                                src={
                                                    displayPreview ??
                                                    existingImageUrl ??
                                                    ""
                                                }
                                                alt="Preview"
                                                className="size-full object-cover"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute right-2 top-2 h-7 w-7"
                                                onClick={handleRemove}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleThumbnailClick}
                                            className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted">
                                            <ImagePlus className="size-8" />
                                            <span className="text-sm">
                                                Click to upload
                                            </span>
                                            <span className="text-xs text-center px-2">
                                                JPEG, PNG, WebP up to 5MB
                                            </span>
                                        </button>
                                    )}
                                    {uploadError && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {uploadError}
                                        </p>
                                    )}
                                </FieldContent>
                            </Field>
                        </div>
                    </FieldGroup>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? "Uploading..."
                                : editingItem
                                  ? "Update"
                                  : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
