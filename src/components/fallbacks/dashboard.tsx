import { Building2, MapPin, Search } from "lucide-react";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
        </div>
    );
}

function SkeletonHeader() {
    return (
        <div className="flex flex-col gap-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-72" />
        </div>
    );
}

function SkeletonFilterBar({ search = true }: { search?: boolean }) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {search && <Skeleton className="h-9 w-56 rounded-md" />}
            <Skeleton className="h-9 w-36 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
            <div className="flex-1" />
            <Skeleton className="h-9 w-32 rounded-md" />
        </div>
    );
}

function SkeletonStatCards({ count = 4 }: { count?: number }) {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
        </div>
    );
}

export function OverviewSkeleton() {
    return (
        <div className="space-y-6">
            <SkeletonHeader />
            <SkeletonStatCards />
            <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-24 rounded-md" />
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                <Skeleton className="h-72 rounded-xl" />
                <Skeleton className="h-72 rounded-xl" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
    );
}

export function KasirSkeleton() {
    return (
        <div className="space-y-6">
            <SkeletonHeader />
            <SkeletonFilterBar />
            <SkeletonStatCards count={2} />
            <TableSkeleton columns={6} rows={5} />
        </div>
    );
}

export function OrdersSkeleton() {
    return (
        <div className="space-y-6">
            <SkeletonHeader />
            <SkeletonStatCards />
            <SkeletonFilterBar search={false} />
            <div className="flex gap-2 mb-2">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-24 rounded-md" />
                ))}
            </div>
            <TableSkeleton columns={6} rows={5} />
        </div>
    );
}

export function ReviewsSkeleton() {
    return (
        <div className="space-y-6">
            <SkeletonHeader />
            <TableSkeleton columns={6} rows={5} />
        </div>
    );
}

export function TransactionsSkeleton() {
    return (
        <div className="space-y-6">
            <SkeletonHeader />
            <TableSkeleton columns={6} rows={5} />
        </div>
    );
}

export function PayoutsSkeleton() {
    return (
        <div className="space-y-6">
            <SkeletonHeader />
            <TableSkeleton columns={6} rows={5} />
        </div>
    );
}

export function MenuSkeleton() {
    return (
        <div className="space-y-6">
            <SkeletonHeader />
            <SkeletonStatCards />
            <SkeletonFilterBar />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-72 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

export function BranchesSkeleton() {
    return (
        <div className="flex flex-1 flex-col min-h-0 gap-6">
            <SkeletonHeader />
            <div className="flex min-h-0 flex-1 flex-col-reverse overflow-hidden rounded-lg border md:flex-row md:gap-px">
                <div className="flex min-h-0 flex-1 items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Building2 />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="flex w-full shrink-0 flex-col border-b md:w-72 md:border-b-0 md:border-r">
                    <div className="border-b p-3">
                        <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                    <div className="flex-1 space-y-1 p-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className="h-14 w-full rounded-lg"
                            />
                        ))}
                    </div>
                    <div className="border-t p-3">
                        <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MapsSkeleton() {
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
            <SkeletonHeader />
            <div className="relative flex flex-1 w-full overflow-hidden rounded-lg border bg-muted min-h-100 items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <MapPin className="animate-pulse" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="absolute left-2 top-2 z-10 flex w-[calc(100%-1rem)] flex-col gap-2 md:left-4 md:top-4 md:w-80">
                    <div className="flex items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-lg backdrop-blur">
                        <Search className="size-4 text-muted-foreground" />
                        <Skeleton className="h-5 flex-1" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CustomersSkeleton() {
    return (
        <div className="space-y-6">
            <SkeletonHeader />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
            </div>
            <SkeletonFilterBar />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

export function EmployeeSkeleton() {
    return (
        <div className="space-y-6">
            <SkeletonHeader />
            <SkeletonFilterBar search={false} />
            <TableSkeleton columns={6} rows={6} />
        </div>
    );
}

export function ChatSkeleton() {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-full overflow-hidden rounded-lg border">
                <div className="flex w-72 shrink-0 flex-col border-r">
                    <div className="border-b p-3">
                        <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto p-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 rounded-lg p-2">
                                <Skeleton className="size-9 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-3 border-b p-3">
                        <Skeleton className="size-9 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-48 rounded-full" />
                                    <Skeleton className="h-4 w-32 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t p-3">
                        <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AuditSkeleton() {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="mx-auto w-full max-w-5xl">
                <div className="flex flex-col gap-5">
                    <SkeletonHeader />
                    <SkeletonFilterBar />
                    <div className="space-y-8">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <div className="ml-6 space-y-3 border-l pl-4">
                                    {Array.from({ length: 2 }).map((_, j) => (
                                        <div key={j} className="space-y-1">
                                            <Skeleton className="h-4 w-56" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NotificationsSkeleton() {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="mx-auto w-full max-w-2xl space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg border p-3">
                        <Skeleton className="mt-1 size-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-64" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="size-4 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SettingsSkeleton() {
    return (
        <div className="space-y-6">
            <SkeletonHeader />
            <Separator />
            <div className="flex flex-1 flex-col space-y-8 md:flex-row md:space-y-0 md:space-x-12">
                <aside className="md:w-48 lg:w-56">
                    <div className="space-y-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className="h-9 w-full rounded-md"
                            />
                        ))}
                    </div>
                </aside>
                <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-1">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-9 w-full rounded-md" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-9 w-28 rounded-md" />
                </div>
            </div>
        </div>
    );
}

export function LandingSkeleton() {
    return (
        <div className="min-h-svh bg-background">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
                <Skeleton className="h-8 w-40" />
                <div className="ml-auto flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                </div>
            </div>
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-6 md:py-20 lg:grid-cols-2">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-48 rounded-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-5 w-full" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32 rounded-md" />
                        <Skeleton className="h-10 w-32 rounded-md" />
                    </div>
                </div>
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            </div>
            <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-12 md:grid-cols-3 md:px-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
        </div>
    );
}
