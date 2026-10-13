import { Calendar, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuditSkeleton } from "@/components/fallbacks/dashboard";
import { SectionHeader } from "@/components/shared/section-header";
import { Timeline } from "@/components/shared/timeline";
import {
    Empty,
    EmptyDescription,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AuditFilterBar } from "@/features/audit/components/audit-filter-bar";
import { AuditTimelineItem } from "@/features/audit/components/audit-timeline-item";
import { useAuditFilters } from "@/features/audit/hooks/useAuditFilters";
import {
    useAuditLogsInfinite,
    useAuditTables,
} from "@/features/audit/hooks/useAuditLogs";
import { groupByDate } from "@/utils/group-by";

export const AuditPage = () => {
    const filters = useAuditFilters();
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
        useAuditLogsInfinite(filters.params);
    const { data: tablesData } = useAuditTables();

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const pages = data?.pages ?? [];
    const firstPage = pages[0];
    const loadError = firstPage && !firstPage.success ? firstPage.error : null;
    const logs = pages.flatMap((p) => (p.success ? p.data.rows : []));
    const total = firstPage?.success ? firstPage.data.total : 0;
    const tablesPayload = tablesData?.success ? tablesData.data : null;

    const grouped = useMemo(() => groupByDate(logs), [logs]);

    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) fetchNextPage();
            },
            { rootMargin: "400px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, logs.length]);

    const handleToggle = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    if (isPending && logs.length === 0 && !loadError) {
        return <AuditSkeleton />;
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="mx-auto w-full max-w-5xl">
                <div className="flex flex-col gap-5">
                    <SectionHeader
                        title="Audit Log"
                        subtitle="Track all system activities and changes across your organization."
                    />

                    <AuditFilterBar
                        search={filters.search}
                        onSearchChange={filters.setSearch}
                        actionFilter={filters.actionFilter}
                        onActionFilterChange={filters.setActionFilter}
                        tableFilter={filters.tableFilter}
                        onTableFilterChange={filters.setTableFilter}
                        uniqueTables={tablesPayload?.tables ?? []}
                        filteredCount={total}
                        totalCount={tablesPayload?.total ?? 0}
                    />

                    {loadError ? (
                        <div className="py-12">
                            <Empty>
                                <EmptyMedia variant="icon">
                                    <Search className="size-6" />
                                </EmptyMedia>
                                <EmptyTitle>
                                    Failed to load audit logs
                                </EmptyTitle>
                                <EmptyDescription>{loadError}</EmptyDescription>
                            </Empty>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-12">
                            <Empty>
                                <EmptyMedia variant="icon">
                                    <Search className="size-6" />
                                </EmptyMedia>
                                <EmptyTitle>No audit logs found</EmptyTitle>
                                <EmptyDescription>
                                    {filters.hasActiveFilter
                                        ? "No logs match your current filters. Try adjusting your criteria."
                                        : "Audit logs will appear here as system activities are recorded."}
                                </EmptyDescription>
                            </Empty>
                        </div>
                    ) : (
                        <ScrollArea className="h-[calc(100vh-22rem)] pr-4">
                            <div className="flex flex-col gap-6">
                                {grouped.map((group) => (
                                    <div key={group.label}>
                                        <div className="sticky top-0 z-10 -mx-1 mb-2 bg-background px-1 pb-1.5 pt-0.5">
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                                    <Calendar className="size-3.5" />
                                                </div>
                                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                    {group.label}
                                                </span>
                                                <Separator className="flex-1" />
                                                <span className="text-[11px] tabular-nums text-muted-foreground/50 font-medium">
                                                    {group.items.length} event
                                                    {group.items.length !== 1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                            </div>
                                        </div>

                                        <Timeline
                                            defaultValue={group.items.length}>
                                            {group.items.map((log, idx) => (
                                                <AuditTimelineItem
                                                    key={log.id}
                                                    log={log}
                                                    step={idx + 1}
                                                    isExpanded={
                                                        expandedId === log.id
                                                    }
                                                    onToggle={handleToggle}
                                                />
                                            ))}
                                        </Timeline>
                                    </div>
                                ))}
                            </div>
                            {hasNextPage ? (
                                <div
                                    ref={loadMoreRef}
                                    className="flex justify-center py-4">
                                    <span className="text-sm text-muted-foreground">
                                        {isFetchingNextPage
                                            ? "Loading more logs..."
                                            : "Scroll to load more"}
                                    </span>
                                </div>
                            ) : null}
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
};
