export interface OverviewStats {
    totalRevenue: number;
    totalOrders: number;
    activeBranches: number;
    avgOrderValue: number;
}

export interface RevenuePoint {
    date: string;
    revenue: number;
}

export interface BranchRevenue {
    branch: string;
    total: number;
    count: number;
}

export interface PaymentMethodItem {
    method: string;
    count: number;
    amount: number;
}

export interface OrderStatusItem {
    status: string;
    count: number;
}

export interface ShiftBreakdown {
    count: number;
    amount: number;
}

export interface BranchRankingRow {
    branchId: string;
    branch: string;
    revenue: number;
    setoranCount: number;
}

export interface CustomerTierItem {
    tier: string;
    count: number;
}

export interface CategoryPerformance {
    category: string;
    qty: number;
    revenue: number;
}

export interface RecentOrderRow {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: string;
    branchName: string;
    createdAt: Date;
}

export interface TopItemRow {
    name: string;
    qty: number;
    revenue: number;
}

export interface OverviewData {
    stats: OverviewStats;
    revenueData: RevenuePoint[];
    branchRevenue: BranchRevenue[];
    paymentMethods: PaymentMethodItem[];
    orderStatuses: OrderStatusItem[];
    shiftData: ShiftBreakdown[];
    topItems: TopItemRow[];
    customerTiers: CustomerTierItem[];
    categoryPerf: CategoryPerformance[];
    recentOrders: RecentOrderRow[];
    branchRanking: BranchRankingRow[];
}
