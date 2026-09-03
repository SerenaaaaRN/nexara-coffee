import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "@/utils/cn";

function TooltipProvider({
    delayDuration = 0,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider> & {
    delayDuration?: number;
}) {
    return <TooltipPrimitive.Provider delay={delayDuration} {...props} />;
}

function Tooltip({
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
    return <TooltipPrimitive.Root {...props} />;
}

function TooltipTrigger({
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
    className,
    sideOffset = 0,
    alignOffset,
    side,
    align,
    children,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Popup> &
    Pick<
        TooltipPrimitive.Positioner.Props,
        "align" | "alignOffset" | "side" | "sideOffset"
    >) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Positioner
                className="isolate z-50"
                side={side}
                sideOffset={sideOffset}
                align={align}
                alignOffset={alignOffset}>
                <TooltipPrimitive.Popup
                    data-slot="tooltip-content"
                    className={cn(
                        "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
                        className,
                    )}
                    {...props}>
                    {children}
                    <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
                </TooltipPrimitive.Popup>
            </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
    );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
