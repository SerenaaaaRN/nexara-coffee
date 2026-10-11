import type { z } from "zod";
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
    FieldError,
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
import type { BranchRow, CreateBranchInput } from "@/features/branches/types";
import { createBranchSchema } from "@/features/branches/types";
import { useFormDialog } from "@/hooks/useFormDialog";

type FormValues = z.infer<typeof createBranchSchema>;

interface BranchFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branch?: BranchRow;
    onSubmit: (data: CreateBranchInput) => Promise<void>;
}

const toFormValues = (branch?: BranchRow): FormValues => ({
    name: branch?.name ?? "",
    address: branch?.address ?? "",
    lat: branch?.lat ?? "",
    lng: branch?.lng ?? "",
    phone: branch?.phone ?? "",
    openingTime: branch?.openingTime?.slice(0, 5) ?? "",
    closingTime: branch?.closingTime?.slice(0, 5) ?? "",
    ownershipType: (branch?.ownershipType ?? "corporate") as
        | "corporate"
        | "franchise",
});

export const BranchFormDialog = ({
    open,
    onOpenChange,
    branch,
    onSubmit: onSubmitProp,
}: BranchFormDialogProps) => {
    const { form } = useFormDialog(createBranchSchema, toFormValues(branch));

    const errors = form.formState.errors;

    const onSubmit = async (values: FormValues) => {
        await onSubmitProp(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {branch ? "Edit Branch" : "Add Branch"}
                    </DialogTitle>
                    <DialogDescription>
                        {branch
                            ? "Update existing branch data"
                            : "Enter new branch details"}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-4">
                    <FieldGroup>
                        <Field data-invalid={!!errors.name}>
                            <FieldLabel htmlFor="name">Branch Name</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="name"
                                    placeholder="Nexara ... "
                                    aria-invalid={!!errors.name}
                                    {...form.register("name")}
                                />
                                <FieldError errors={[errors.name]} />
                            </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.address}>
                            <FieldLabel htmlFor="address">Address</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="address"
                                    placeholder="Jl..."
                                    aria-invalid={!!errors.address}
                                    {...form.register("address")}
                                />
                                <FieldError errors={[errors.address]} />
                            </FieldContent>
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field data-invalid={!!errors.lat}>
                                <FieldLabel htmlFor="lat">Latitude</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="lat"
                                        aria-invalid={!!errors.lat}
                                        {...form.register("lat")}
                                    />
                                </FieldContent>
                            </Field>

                            <Field data-invalid={!!errors.lng}>
                                <FieldLabel htmlFor="lng">Longitude</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="lng"
                                        aria-invalid={!!errors.lng}
                                        {...form.register("lng")}
                                    />
                                </FieldContent>
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field data-invalid={!!errors.phone}>
                                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="phone"
                                        placeholder="0711-123456"
                                        aria-invalid={!!errors.phone}
                                        {...form.register("phone")}
                                    />
                                </FieldContent>
                            </Field>

                            <Field data-invalid={!!errors.ownershipType}>
                                <FieldLabel>Ownership Type</FieldLabel>
                                <FieldContent>
                                    <Select
                                        onValueChange={(v) =>
                                            form.setValue(
                                                "ownershipType",
                                                (v ??
                                                    form.watch(
                                                        "ownershipType",
                                                    )) as
                                                    | "corporate"
                                                    | "franchise",
                                            )
                                        }
                                        defaultValue={form.watch(
                                            "ownershipType",
                                        )}
                                        items={{
                                            corporate: "Corporate",
                                            franchise: "Franchise",
                                        }}>
                                        <SelectTrigger
                                            aria-invalid={
                                                !!errors.ownershipType
                                            }>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="corporate">
                                                    Corporate
                                                </SelectItem>
                                                <SelectItem value="franchise">
                                                    Franchise
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FieldContent>
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field data-invalid={!!errors.openingTime}>
                                <FieldLabel htmlFor="openingTime">
                                    Opening
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="openingTime"
                                        type="text"
                                        placeholder="08:00"
                                        aria-invalid={!!errors.openingTime}
                                        {...form.register("openingTime")}
                                    />
                                    <FieldError errors={[errors.openingTime]} />
                                </FieldContent>
                            </Field>

                            <Field data-invalid={!!errors.closingTime}>
                                <FieldLabel htmlFor="closingTime">
                                    Closing
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="closingTime"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="17:00"
                                        maxLength={5}
                                        aria-invalid={!!errors.closingTime}
                                        {...form.register("closingTime")}
                                    />
                                    <FieldError errors={[errors.closingTime]} />
                                </FieldContent>
                            </Field>
                        </div>
                    </FieldGroup>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">{branch ? "Save" : "Add"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
