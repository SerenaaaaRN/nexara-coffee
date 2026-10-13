import { useEffect, useState } from "react";

/** Menunda propagasi value selama `delayMs` setelah perubahan terakhir. */
export const useDebounce = <T>(value: T, delayMs = 300): T => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
};
