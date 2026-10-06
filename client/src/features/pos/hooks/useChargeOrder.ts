import { useState, useTransition } from "react";
import { toast } from "sonner";
import { lookupCustomerByPhone } from "@/features/customers/hooks/useCustomerQueries";
import { useCreateOrder } from "@/features/orders/hooks/useOrderMutations";
import type { POSCartItem } from "@/features/pos/types";
import { useRecordTransaction } from "@/features/transactions/hooks/useTransactionMutations";
import type { PAYMENT_METHODS } from "@/features/transactions/types";

type ChargeParams = {
    branchId: string | undefined;
    cart: POSCartItem[];
    subtotal: number;
    onCharged: () => void;
};

/**
 * Alur checkout POS: lookup member via HP, buat order, catat transaksi.
 */
export const useChargeOrder = ({
    branchId,
    cart,
    subtotal,
    onCharged,
}: ChargeParams) => {
    const [isPending, startTransition] = useTransition();
    const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] =
        useState<(typeof PAYMENT_METHODS)[number]>("cash");
    const [customerPhone, setCustomerPhone] = useState("");

    const createOrder = useCreateOrder();
    const recordTransaction = useRecordTransaction();

    const openChargeDialog = () => setChargeDialogOpen(true);

    const handleCharge = () => {
        if (!branchId || cart.length === 0) return;

        startTransition(async () => {
            let customerId: string | undefined;

            try {
                if (customerPhone.trim() !== "") {
                    const custRes = await lookupCustomerByPhone(
                        customerPhone.trim(),
                    ).catch(() => null);
                    if (custRes?.success && custRes.data) {
                        customerId = custRes.data.id;
                    } else if (custRes && !custRes.success) {
                        console.error("Customer lookup failed:", custRes.error);
                    }
                }
            } catch (e) {
                console.error("Error looking up customer:", e);
            }

            const orderItems = cart.map((item) => ({
                menuItemId: item.menuItem.id,
                name: item.menuItem.name,
                price: Number(item.menuItem.price),
                qty: item.quantity,
            }));

            const res = await createOrder.mutateAsync({
                branchId,
                customerId,
                items: orderItems,
            });

            if (res.success) {
                const txnRes = await recordTransaction.mutateAsync({
                    orderId: res.data.id,
                    branchId,
                    paymentMethod,
                    amount: subtotal,
                });

                if (txnRes.success) {
                    toast.success("Order & Payment Successful", {
                        description: `Order Number: ${res.data.orderNumber} paid via ${paymentMethod.toUpperCase()}`,
                    });
                    onCharged();
                    setChargeDialogOpen(false);
                    setPaymentMethod("cash");
                    setCustomerPhone("");
                } else {
                    toast.warning(
                        "Order created but payment recording failed",
                        {
                            description: Array.isArray(txnRes.error)
                                ? txnRes.error.map((e) => e.message).join(", ")
                                : txnRes.error,
                        },
                    );
                }
            } else {
                toast.error("Failed to create order", {
                    description: Array.isArray(res.error)
                        ? res.error.map((e) => e.message).join(", ")
                        : res.error,
                });
            }
        });
    };

    return {
        isPending,
        chargeDialogOpen,
        setChargeDialogOpen,
        paymentMethod,
        setPaymentMethod,
        customerPhone,
        setCustomerPhone,
        openChargeDialog,
        handleCharge,
    };
};
