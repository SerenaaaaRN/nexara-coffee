import { GalleryVerticalEnd } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthSkeleton() {
    return (
        <main className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <div className="flex items-center gap-2 font-medium">
                        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <GalleryVerticalEnd className="size-4" />
                        </div>
                        Nexara Inc.
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="flex w-full max-w-xs flex-col gap-4">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </div>
            <div className="relative hidden bg-linear-to-br from-primary/10 to-primary/5 lg:block">
                <Skeleton className="absolute inset-0 h-full w-full" />
            </div>
        </main>
    );
}
