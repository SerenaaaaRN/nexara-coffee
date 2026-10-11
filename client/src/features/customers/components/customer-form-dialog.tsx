import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
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
import { useUpdateCustomer } from "@/features/customers/hooks/useCustomerMutations";
import {
    CUSTOMER_SEGMENTS,
    type CustomerRow,
    createCustomerSchema,
    LOYALTY_TIERS,
} from "@/features/customers/types";
import { useFormDialog } from "@/hooks/useFormDialog";
import { formatLabel } from "@/utils/format";

type FormData = z.infer<typeof createCustomerSchema>;

type CustomerFormFields = Pick<
    CustomerRow,
    | "id"
    | "fullName"
    | "email"
    | "phone"
    | "segment"
    | "loyaltyPoints"
    | "loyaltyTier"
>;

type CustomerFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: CustomerFormFields;
    onSuccess: () => void;
};

export const CustomerFormDialog = ({
    open,
    onOpenChange,
    customer,
    onSuccess,
}: CustomerFormDialogProps) => {
    const updateMutation = useUpdateCustomer();

    const { form, resetForm } = useFormDialog(createCustomerSchema, {
        fullName: "",
        email: "",
        phone: "",
        segment: CUSTOMER_SEGMENTS[0],
        loyaltyPoints: 0,
        loyaltyTier: LOYALTY_TIERS[0],
    });

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = form;

    useEffect(() => {
        if (open) {
            resetForm({
                fullName: customer.fullName,
                email: customer.email ?? "",
                phone: customer.phone ?? "",
                segment: customer.segment as FormData["segment"],
                loyaltyPoints: customer.loyaltyPoints,
                loyaltyTier: customer.loyaltyTier as FormData["loyaltyTier"],
            });
        }
    }, [open, customer, resetForm]);

    const onSubmit = async (data: FormData) => {
        const res = await updateMutation.mutateAsync({
            id: customer.id,
            ...data,
        });
        if (res.success) {
            toast.success("Customer updated");
            onSuccess();
        } else {
            toast.error("Failed to update customer");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                    <DialogDescription>
                        Update customer details below.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4">
                    <FieldGroup>
                        <Field data-invalid={!!errors.fullName}>
                            <FieldLabel htmlFor="fullName">
                                Full Name
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="fullName"
                                    placeholder="John Doe"
                                    aria-invalid={!!errors.fullName}
                                    {...register("fullName")}
                                />
                            </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.email}>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    aria-invalid={!!errors.email}
                                    {...register("email")}
                                />
                            </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.phone}>
                            <FieldLabel htmlFor="phone">Phone</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="phone"
                                    placeholder="0812-3456-7890"
                                    aria-invalid={!!errors.phone}
                                    {...register("phone")}
                                />
                            </FieldContent>
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field data-invalid={!!errors.segment}>
                                <FieldLabel>Segment</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={control}
                                        name="segment"
                                        render={({ field, fieldState }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={(v) =>
                                                    field.onChange(v ?? "")
                                                }
                                                items={Object.fromEntries(
                                                    CUSTOMER_SEGMENTS.map(
                                                        (s) => [
                                                            s,
                                                            formatLabel(s),
                                                        ],
                                                    ),
                                                )}>
                                                <SelectTrigger
                                                    aria-invalid={
                                                        !!fieldState.error
                                                    }>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {CUSTOMER_SEGMENTS.map(
                                                            (s) => (
                                                                <SelectItem
                                                                    key={s}
                                                                    value={s}>
                                                                    {formatLabel(
                                                                        s,
                                                                    )}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                            </Field>

                            <Field data-invalid={!!errors.loyaltyTier}>
                                <FieldLabel>Loyalty Tier</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={control}
                                        name="loyaltyTier"
                                        render={({ field, fieldState }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={(v) =>
                                                    field.onChange(v ?? "")
                                                }
                                                items={Object.fromEntries(
                                                    LOYALTY_TIERS.map((t) => [
                                                        t,
                                                        formatLabel(t),
                                                    ]),
                                                )}>
                                                <SelectTrigger
                                                    aria-invalid={
                                                        !!fieldState.error
                                                    }>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {LOYALTY_TIERS.map(
                                                            (t) => (
                                                                <SelectItem
                                                                    key={t}
                                                                    value={t}>
                                                                    {formatLabel(
                                                                        t,
                                                                    )}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                            </Field>
                        </div>

                        <Field data-invalid={!!errors.loyaltyPoints}>
                            <FieldLabel htmlFor="loyaltyPoints">
                                Loyalty Points
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="loyaltyPoints"
                                    type="number"
                                    min={0}
                                    aria-invalid={!!errors.loyaltyPoints}
                                    {...register("loyaltyPoints", {
                                        valueAsNumber: true,
                                    })}
                                />
                            </FieldContent>
                        </Field>
                    </FieldGroup>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 data-icon="inline-start" />
                            ) : null}
                            Update
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
