import { Skeleton } from "@/components/ui/skeleton";

export function PosSkeleton() {
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="h-8 w-24 rounded-md" />
                </div>
            </header>
            <main className="flex-1 overflow-hidden p-4">
                <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <div className="grid grid-cols-3 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className="aspect-square w-full rounded-xl"
                                />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                </div>
            </main>
        </div>
    );
}
