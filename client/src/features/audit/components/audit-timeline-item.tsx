import { ChevronDown, ChevronRight } from "lucide-react";
import type { ElementType } from "react";
import {
    TimelineContent,
    TimelineDate,
    TimelineHeader,
    TimelineIndicator,
    TimelineItem,
    TimelineSeparator,
    TimelineTitle,
} from "@/components/shared/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuditAction, AuditLogRow } from "@/features/audit/types";
import {
    AUDIT_ACTION_DEFAULT_ICON,
    AUDIT_ACTION_ICONS,
    formatActionLabel,
} from "@/features/audit/utils";
import { formatLabel, formatRelativeTime } from "@/utils/format";

interface AuditTimelineItemProps {
    log: AuditLogRow;
    step: number;
    isExpanded: boolean;
    onToggle: (id: string) => void;
}

export const AuditTimelineItem = ({
    log,
    step,
    isExpanded,
    onToggle,
}: AuditTimelineItemProps) => {
    const IndicatorIcon: ElementType =
        AUDIT_ACTION_ICONS[log.action as AuditAction] ??
        AUDIT_ACTION_DEFAULT_ICON;
    const actor = log.actorName ?? (
        <span className="italic text-muted-foreground">System</span>
    );

    return (
        <TimelineItem
            key={log.id}
            step={step}
            className="group-data-[orientation=vertical]/timeline:ms-10">
            <TimelineHeader>
                <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
                <TimelineTitle className="mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{actor}</span>
                    <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 font-normal h-5">
                        {formatActionLabel(log.action)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                        {formatLabel(log.targetTable)}
                    </span>
                </TimelineTitle>
                <TimelineIndicator className="bg-primary/10 group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center border-none group-data-[orientation=vertical]/timeline:-left-7">
                    <IndicatorIcon className="size-3.5" />
                </TimelineIndicator>
            </TimelineHeader>
            <TimelineContent>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {log.branchName ? (
                        <span className="inline-flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
                                Branch
                            </span>
                            <span>{log.branchName}</span>
                        </span>
                    ) : null}
                    {log.targetId ? (
                        <span className="inline-flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
                                ID
                            </span>
                            <span className="font-mono text-xs">
                                #{log.targetId.slice(0, 8)}
                            </span>
                        </span>
                    ) : null}
                </div>
                <TimelineDate className="mt-1.5 mb-0 text-xs font-medium">
                    {formatRelativeTime(log.createdAt)}
                </TimelineDate>

                {log.metadata ? (
                    <div className="mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground"
                            onClick={() => onToggle(log.id)}>
                            {isExpanded ? (
                                <ChevronDown className="size-3" />
                            ) : (
                                <ChevronRight className="size-3" />
                            )}
                            {isExpanded ? "Hide Details" : "Show Details"}
                        </Button>
                        {isExpanded ? (
                            <pre className="mt-2 rounded-lg border bg-muted/40 p-3 text-xs font-mono leading-relaxed overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                        ) : null}
                    </div>
                ) : null}
            </TimelineContent>
        </TimelineItem>
    );
};
