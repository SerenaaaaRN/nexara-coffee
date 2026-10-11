export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

/** Rp10.000 belanja = 1 poin loyalty. Port dari nexara-coffee features/customers/types.ts */
export const POINTS_PER_RP = 10_000;

/** Ambang poin naik tier (di bawah silver = bronze). */
export const TIER_THRESHOLDS = {
	silver: 100,
	gold: 500,
	platinum: 1000,
} as const;

/** Tier untuk jumlah poin tertentu. */
export const tierForPoints = (points: number): LoyaltyTier => {
	if (points >= TIER_THRESHOLDS.platinum) return "platinum";
	if (points >= TIER_THRESHOLDS.gold) return "gold";
	if (points >= TIER_THRESHOLDS.silver) return "silver";
	return "bronze";
};

/** Poin yang didapat dari nominal belanja (dibulatkan ke bawah). */
export const earnedPointsForTotal = (total: number | string): number =>
	Math.floor(Number(total) / POINTS_PER_RP);

/** Normalisasi nomor HP: buang semua non-digit. */
export const normalizePhone = (phone: string): string =>
	phone.replace(/\D/g, "");
