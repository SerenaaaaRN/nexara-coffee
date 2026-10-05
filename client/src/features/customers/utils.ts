import type { LoyaltyTier } from "@/features/customers/types";

export const TIER_COLORS: Record<LoyaltyTier, string> = {
    bronze: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    silver: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
    gold: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    platinum:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export const AVATAR_COLORS = [
    "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
    "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400",
    "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400",
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
];

export const getAvatarColor = (name: string) => {
    const code = name.charCodeAt(0) ?? 0;
    return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

export const getInitials = (name: string) =>
    name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
