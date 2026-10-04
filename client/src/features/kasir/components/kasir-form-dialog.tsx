import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Controller, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";
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
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { KasirPosSummary } from "@/features/kasir/components/kasir-pos-summary";
import { useCreateSetoran } from "@/features/kasir/hooks/useKasirMutations";
import { useExpectedCash } from "@/features/kasir/hooks/useKasirQueries";
import { createSetoranSchema } from "@/features/kasir/types";
import { useFormDialog } from "@/hooks/useFormDialog";

type FormData = z.infer<typeof createSetoranSchema>;

interface KasirFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branchId: string;
    onSuccess: () => void;
}

export const KasirFormDialog = ({
    open,
    onOpenChange,
    branchId,
    onSuccess,
}: KasirFormDialogProps) => {
    const { form, resetForm } = useFormDialog(createSetoranSchema, {
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        notes: "",
    });

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = form;

    const createMutation = useCreateSetoran();

    const watchedDate = useWatch({ control, name: "date" });
    const watchedAmount = useWatch({ control, name: "amount" });

    const { data: expectedRes, isLoading: expectedLoading } = useExpectedCash(
        branchId,
        watchedDate,
        { enabled: open && !!branchId && !!watchedDate },
    );
    const expectedData = expectedRes?.success ? expectedRes.data : undefined;

    const hasManuallyEdited = useRef(false);

    useEffect(() => {
        if (open) {
            hasManuallyEdited.current = false;
            resetForm({
                amount: 0,
                date: new Date().toISOString().split("T")[0],
                notes: "",
            });
        }
    }, [open, resetForm]);

    useEffect(() => {
        if (
            expectedData &&
            !hasManuallyEdited.current &&
            expectedData.cashTotal > 0
        ) {
            form.setValue("amount", expectedData.cashTotal);
        }
    }, [expectedData, form]);

    const onSubmit = useCallback(
        async (data: FormData) => {
            const res = await createMutation
                .mutateAsync({ branchId, formData: data })
                .catch(() => null);
            if (res?.success) {
                toast.success("Setoran recorded");
                onSuccess();
            } else {
                toast.error(res?.error ?? "Failed to record setoran");
            }
        },
        [branchId, onSuccess, createMutation],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Setoran</DialogTitle>
                    <DialogDescription>
                        Enter the cash deposit amount for today.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4">
                    <KasirPosSummary
                        data={expectedData}
                        declaredAmount={watchedAmount}
                        isLoading={expectedLoading}
                    />

                    <FieldGroup>
                        <Field data-invalid={!!errors.date}>
                            <FieldLabel htmlFor="date">Date</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="date"
                                    type="date"
                                    aria-invalid={!!errors.date}
                                    {...register("date")}
                                />
                                <FieldError
                                    errors={errors.date ? [errors.date] : []}
                                />
                            </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.amount}>
                            <FieldLabel htmlFor="amount">
                                Amount (Rp)
                            </FieldLabel>
                            <FieldContent>
                                <Controller
                                    control={control}
                                    name="amount"
                                    render={({ field }) => (
                                        <CurrencyInput
                                            id="amount"
                                            placeholder="0"
                                            aria-invalid={!!errors.amount}
                                            value={field.value as number}
                                            onChange={(val) => {
                                                hasManuallyEdited.current = true;
                                                field.onChange(val);
                                            }}
                                        />
                                    )}
                                />
                                <FieldError
                                    errors={
                                        errors.amount ? [errors.amount] : []
                                    }
                                />
                            </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.notes}>
                            <FieldLabel htmlFor="notes">Notes</FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="notes"
                                    placeholder="Optional notes..."
                                    className="resize-none"
                                    aria-invalid={!!errors.notes}
                                    {...register("notes")}
                                />
                                <FieldError
                                    errors={errors.notes ? [errors.notes] : []}
                                />
                            </FieldContent>
                        </Field>
                    </FieldGroup>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isSubmitting || createMutation.isPending}>
                            {(isSubmitting || createMutation.isPending) && (
                                <Loader2 data-icon="inline-start" />
                            )}
                            Record
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
