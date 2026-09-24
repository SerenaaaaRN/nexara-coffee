import type { ComponentProps, ReactNode } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmDialogProps = {
    title: string;
    description: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    icon?: ReactNode;
    variant?: ComponentProps<typeof AlertDialogAction>["variant"];
} & ComponentProps<typeof AlertDialog>;

export function ConfirmDialog({
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    icon,
    variant = "destructive",
    ...rootProps
}: ConfirmDialogProps) {
    return (
        <AlertDialog {...rootProps}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    {icon && <AlertDialogMedia>{icon}</AlertDialogMedia>}
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction variant={variant} onClick={onConfirm}>
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
