import { Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/utils/cn";

const THEME_CARDS: Record<string, { label: string; preview: string[] }> = {
    white: {
        label: "White",
        preview: ["bg-[#eef2f6]", "bg-white", "bg-[#eef2f6]", "bg-[#eef2f6]"],
    },
    garden: {
        label: "Garden",
        preview: ["bg-[#e8f0e4]", "bg-white", "bg-[#d4e0cc]", "bg-[#bacfad]"],
    },
    mono: {
        label: "Mono",
        preview: ["bg-[#f0f0f0]", "bg-white", "bg-[#888888]", "bg-[#bbbbbb]"],
    },
    cyberpunk: {
        label: "Cyberpunk",
        preview: ["bg-[#f0eeff]", "bg-white", "bg-[#ff2d78]", "bg-[#c084fc]"],
    },
    dark: {
        label: "Dark",
        preview: [
            "bg-slate-950",
            "bg-slate-800",
            "bg-slate-400",
            "bg-slate-400",
        ],
    },
};

export function ThemeSheet() {
    const { theme, setTheme, themes } = useTheme();

    return (
        <Sheet>
            <SheetTrigger
                render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Palette className="h-4 w-4" />
                        <span className="sr-only">Theme</span>
                    </Button>
                }
            />
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>Theme</SheetTitle>
                    <SheetDescription>
                        Quick switch between themes
                    </SheetDescription>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3 p-4">
                    {themes.map((t) => {
                        const card = THEME_CARDS[t];
                        if (!card) return null;
                        const active = theme === t;
                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTheme(t)}
                                className={cn(
                                    "cursor-pointer rounded-lg border-2 p-1 text-left transition-all hover:border-primary",
                                    active
                                        ? "border-primary bg-primary/5"
                                        : "border-muted",
                                )}>
                                <div
                                    className={cn(
                                        "space-y-1.5 rounded-md p-2",
                                        card.preview[0],
                                    )}>
                                    <div
                                        className={cn(
                                            "space-y-1.5 rounded-md p-1.5 shadow-xs",
                                            card.preview[1],
                                        )}>
                                        <div
                                            className={cn(
                                                "h-1.5 w-14 rounded-lg",
                                                card.preview[2],
                                            )}
                                        />
                                        <div
                                            className={cn(
                                                "h-1.5 w-20 rounded-lg",
                                                card.preview[3],
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-1.5">
                                    <span className="text-xs font-medium">
                                        {card.label}
                                    </span>
                                    {active && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground">
                        Press{" "}
                        <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-[10px] font-medium opacity-100">
                            D
                        </kbd>{" "}
                        to cycle through themes
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
