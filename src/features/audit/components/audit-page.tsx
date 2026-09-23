import { Calendar, Search } from "lucide-react";
import { useState } from "react";
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
import { useAuditLogs } from "@/features/audit/hooks/useAuditLogs";

export const AuditPage = () => {
    const { data } = useAuditLogs();
    const logs = data?.data ?? [];

    const {
        search,
        setSearch,
        actionFilter,
        setActionFilter,
        tableFilter,
        setTableFilter,
        uniqueTables,
        filtered,
        grouped,
    } = useAuditFilters(logs);

    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleToggle = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="mx-auto w-full max-w-5xl">
                <div className="flex flex-col gap-5">
                    <SectionHeader
                        title="Audit Log"
                        subtitle="Track all system activities and changes across your organization."
                    />

                    <AuditFilterBar
                        search={search}
                        onSearchChange={setSearch}
                        actionFilter={actionFilter}
                        onActionFilterChange={setActionFilter}
                        tableFilter={tableFilter}
                        onTableFilterChange={setTableFilter}
                        uniqueTables={uniqueTables}
                        filteredCount={filtered.length}
                        totalCount={logs.length}
                    />

                    {filtered.length === 0 ? (
                        <div className="py-12" data-tour="audit-list">
                            <Empty>
                                <EmptyMedia variant="icon">
                                    <Search className="size-6" />
                                </EmptyMedia>
                                <EmptyTitle>No audit logs found</EmptyTitle>
                                <EmptyDescription>
                                    {logs.length === 0
                                        ? "Audit logs will appear here as system activities are recorded."
                                        : "No logs match your current filters. Try adjusting your criteria."}
                                </EmptyDescription>
                            </Empty>
                        </div>
                    ) : (
                        <ScrollArea
                            data-tour="audit-list"
                            className="h-[calc(100vh-22rem)] pr-4">
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
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
};
