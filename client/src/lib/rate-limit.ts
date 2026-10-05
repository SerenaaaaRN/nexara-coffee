const stores = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
    key: string,
    limit: number,
    windowMs: number,
): boolean {
    const now = Date.now();
    const entry = stores.get(key);

    if (!entry || now > entry.resetAt) {
        stores.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (entry.count >= limit) {
        return false;
    }

    entry.count++;
    return true;
}

// Clean up expired entries every 60 seconds to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of stores) {
        if (now > entry.resetAt) {
            stores.delete(key);
        }
    }
}, 60_000);
