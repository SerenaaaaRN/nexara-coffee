import { useMemo, useState } from "react";
import type { POSCartItem, POSMenuItem } from "@/features/pos/types";

/**
 * State keranjang POS: tambah, ubah qty, hapus, dan subtotal.
 *
 * @returns cart, subtotal, dan aksi-aksinya
 */
export const usePosCart = () => {
    const [cart, setCart] = useState<POSCartItem[]>([]);

    const addToCart = (item: POSMenuItem) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.menuItem.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.menuItem.id === item.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i,
                );
            }
            return [
                ...prev,
                { id: crypto.randomUUID(), menuItem: item, quantity: 1 },
            ];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.id === id) {
                        const newQuantity = item.quantity + delta;
                        return newQuantity > 0
                            ? { ...item, quantity: newQuantity }
                            : item;
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0),
        );
    };

    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const clearCart = () => setCart([]);

    const subtotal = useMemo(
        () =>
            cart.reduce(
                (sum, item) =>
                    sum + Number(item.menuItem.price) * item.quantity,
                0,
            ),
        [cart],
    );

    return {
        cart,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
    };
};
