import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    className?: string;
}

export function StatCard({
    label,
    value,
    icon: Icon,
    className,
}: StatCardProps) {
    return (
        <Card size="sm" className={cn("gap-0", className)}>
            <CardContent>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {Icon && <Icon className="size-4 text-muted-foreground" />}
                </div>
                <p className="text-lg font-bold">{value}</p>
            </CardContent>
        </Card>
    );
}
