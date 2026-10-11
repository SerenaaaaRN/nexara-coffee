import {
    Loader2,
    Minus,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useChargeOrder } from "@/features/pos/hooks/useChargeOrder";
import { usePosCart } from "@/features/pos/hooks/usePosCart";
import { usePosCatalog } from "@/features/pos/hooks/usePosCatalog";
import { MemberCheckStatus } from "@/features/pos/components/member-check-status";
import type { POSClientProps } from "@/features/pos/types";
import { PAYMENT_METHODS } from "@/features/transactions/types";
import { formatCurrency } from "@/utils/format";

export const POSClient = ({ branchId, categories, items }: POSClientProps) => {
    const {
        cart,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
    } = usePosCart();
    const {
        search,
        activeCategory,
        setSearch,
        setActiveCategory,
        filteredItems,
    } = usePosCatalog(items);
    const {
        isPending,
        chargeDialogOpen,
        setChargeDialogOpen,
        paymentMethod,
        setPaymentMethod,
        customerPhone,
        setCustomerPhone,
        handleCharge,
    } = useChargeOrder({ branchId, cart, subtotal, onCharged: clearCart });

    if (!branchId) {
        return (
            <div className="flex h-full items-center justify-center p-4 text-center">
                <div className="max-w-md space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Select a Branch
                    </h2>
                    <p className="text-muted-foreground">
                        You must select a branch to start recording orders.
                        Please return to the dashboard and select a branch from
                        the top menu.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-56px)] w-full flex-col lg:flex-row overflow-hidden">
            {/* LEFT: Menu Catalog */}
            <aside className="flex h-full flex-1 flex-col overflow-hidden bg-muted/20">
                <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search menu..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 bg-background"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={
                                activeCategory === "all" ? "default" : "outline"
                            }
                            onClick={() => setActiveCategory("all")}
                            size="sm">
                            All
                        </Button>
                        {categories.map((cat) => (
                            <Button
                                key={cat.id}
                                variant={
                                    activeCategory === cat.id
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() => setActiveCategory(cat.id)}
                                size="sm">
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>

                <ScrollArea className="flex-1 p-4 h-[calc(100vh-140px)]">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pb-20 lg:pb-0">
                        {filteredItems.map((item) => (
                            <Card
                                key={item.id}
                                className="cursor-pointer transition-all hover:border-primary hover:shadow-sm"
                                onClick={() => addToCart(item)}>
                                <CardContent className="p-3 flex flex-col gap-2 h-full">
                                    <div className="aspect-square w-full rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-muted-foreground text-xs uppercase font-medium">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm line-clamp-2 leading-tight">
                                            {item.name}
                                        </div>
                                    </div>
                                    <div className="font-mono text-sm text-primary font-medium">
                                        {formatCurrency(item.price)}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {filteredItems.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-muted-foreground">
                                No items found for this filter.
                            </div>
                        ) : null}
                    </div>
                </ScrollArea>
            </aside>

            {/* RIGHT: Cart */}
            <div className="flex h-[50vh] w-full flex-col border-l bg-background lg:h-full lg:w-95 xl:w-105 shrink-0">
                <div className="flex items-center gap-2 border-b p-4">
                    <ShoppingCart className="size-5" />
                    <h2 className="font-semibold tracking-tight">
                        Current Order
                    </h2>
                    <Badge variant="secondary" className="ml-auto">
                        {cart.length} items
                    </Badge>
                </div>

                <ScrollArea className="flex-1 p-4 h-[calc(100vh-140px)]">
                    {cart.length === 0 ? (
                        <div className="flex h-40 items-center justify-center text-muted-foreground">
                            Cart is empty
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="font-medium text-sm leading-tight">
                                            {item.menuItem.name}
                                        </div>
                                        <div className="font-mono text-sm font-medium shrink-0">
                                            {formatCurrency(
                                                Number(item.menuItem.price) *
                                                    item.quantity,
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {formatCurrency(
                                                item.menuItem.price,
                                            )}{" "}
                                            each
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-7"
                                                onClick={() =>
                                                    updateQuantity(item.id, -1)
                                                }>
                                                <Minus className="size-3" />
                                            </Button>
                                            <span className="w-6 text-center text-sm font-medium">
                                                {item.quantity}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-7"
                                                onClick={() =>
                                                    updateQuantity(item.id, 1)
                                                }>
                                                <Plus className="size-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 ml-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() =>
                                                    removeFromCart(item.id)
                                                }>
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Separator className="mt-2" />
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="border-t bg-muted/30 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-medium text-muted-foreground">
                            Subtotal
                        </span>
                        <span className="font-mono font-semibold">
                            {formatCurrency(subtotal)}
                        </span>
                    </div>
                    <Button
                        className="w-full text-lg h-12"
                        disabled={cart.length === 0}
                        onClick={() => setChargeDialogOpen(true)}>
                        Charge {formatCurrency(subtotal)}
                    </Button>
                </div>
            </div>

            <Dialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to create an order for{" "}
                            {cart.length} items?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex justify-between items-center text-lg font-semibold">
                            <Label>Total:</Label>
                            <span className="font-mono">
                                {formatCurrency(subtotal)}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                No. HP Member (Optional)
                            </Label>
                            <Input
                                placeholder="08xx untuk akumulasi poin member..."
                                inputMode="tel"
                                value={customerPhone}
                                onChange={(e) =>
                                    setCustomerPhone(e.target.value)
                                }
                            />
                            <MemberCheckStatus phone={customerPhone} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Payment Method
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {PAYMENT_METHODS.map((method) => (
                                    <Button
                                        key={method}
                                        type="button"
                                        variant={
                                            paymentMethod === method
                                                ? "default"
                                                : "outline"
                                        }
                                        className={
                                            paymentMethod === method
                                                ? undefined
                                                : "text-muted-foreground"
                                        }
                                        onClick={() =>
                                            setPaymentMethod(method)
                                        }>
                                        {method === "cash"
                                            ? "Cash"
                                            : method === "qris"
                                              ? "QRIS"
                                              : method === "debit"
                                                ? "Debit Card"
                                                : "Credit Card"}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setChargeDialogOpen(false)}
                            disabled={isPending}>
                            Cancel
                        </Button>
                        <Button onClick={handleCharge} disabled={isPending}>
                            {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Confirm Charge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
