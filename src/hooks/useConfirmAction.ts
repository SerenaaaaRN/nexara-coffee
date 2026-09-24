import { useCallback, useMemo, useState } from "react";

/**
 * Generic hook untuk konfirmasi aksi via ConfirmDialog.
 * Mengelola state target + dialogProps (open/onOpenChange).
 * Tipe generic T menentukan bentuk data yang dikonfirmasi (default string).
 */
export function useConfirmAction<T = string>() {
    const [target, setTarget] = useState<T | null>(null);
    const [isPending, setIsPending] = useState(false);

    const dialogProps = useMemo(
        () => ({
            open: target !== null,
            onOpenChange: (open: boolean) => {
                if (!open) {
                    setTarget(null);
                    setIsPending(false);
                }
            },
        }),
        [target],
    );

    /** Hapus target dan tutup dialog. */
    const clearTarget = useCallback(() => {
        setTarget(null);
        setIsPending(false);
    }, []);

    return {
        target,
        setTarget,
        dialogProps,
        clearTarget,
        isPending,
        setIsPending,
    };
}
