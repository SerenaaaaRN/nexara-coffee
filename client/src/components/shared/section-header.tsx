import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

interface SectionHeaderProps extends ComponentProps<"header"> {
    title: string;
    subtitle: string;
}

export const SectionHeader = ({
    title,
    subtitle,
    className,
    ...props
}: SectionHeaderProps) => {
    return (
        <header
            className={cn("flex items-center justify-between", className)}
            {...props}>
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    {title}
                </h1>
                <p className="text-muted-foreground">{subtitle}</p>
            </div>
        </header>
    );
};
