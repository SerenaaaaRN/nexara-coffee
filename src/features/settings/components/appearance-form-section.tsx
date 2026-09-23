import { useTheme } from "next-themes";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/utils/cn";

const THEME_META: Record<string, { label: string; desc: string }> = {
    white: { label: "White", desc: "Clean white theme" },
    garden: { label: "Garden", desc: "Soft green tones" },
    mono: { label: "Mono", desc: "Monochrome grayscale" },
    cyberpunk: { label: "Cyberpunk", desc: "Vibrant neon accents" },
    dark: { label: "Dark", desc: "Universal dark mode" },
};

export const AppearanceFormSection = () => {
    const { theme, setTheme, themes } = useTheme();

    return (
        <div className="space-y-6">
            <Field>
                <FieldLabel>Theme</FieldLabel>
                <FieldDescription>
                    Choose a theme, or press{" "}
                    <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]">
                        D
                    </kbd>{" "}
                    to cycle through all themes.
                </FieldDescription>
                <FieldContent>
                    <div
                        data-tour="settings-theme"
                        className="grid grid-cols-3 gap-4 pt-2">
                        {themes.map((t) => {
                            const meta = THEME_META[t];
                            if (!meta) return null;
                            const active = theme === t;
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTheme(t)}
                                    className={cn(
                                        "group cursor-pointer rounded-lg border-2 p-1 text-left transition-all hover:border-primary",
                                        active
                                            ? "border-primary bg-primary/5"
                                            : "border-muted",
                                    )}>
                                    <div
                                        className={cn(
                                            "space-y-2 rounded-md p-2",
                                            t === "white" && "bg-[#eef2f6]",
                                            t === "garden" && "bg-[#e8f0e4]",
                                            t === "mono" && "bg-[#f0f0f0]",
                                            t === "cyberpunk" && "bg-[#f0eeff]",
                                            t === "dark" && "bg-slate-950",
                                        )}>
                                        <div
                                            className={cn(
                                                "space-y-2 rounded-md p-2 shadow-xs",
                                                t !== "dark" && "bg-white",
                                                t === "dark" && "bg-slate-800",
                                            )}>
                                            <div
                                                className={cn(
                                                    "h-2 w-20 rounded-lg",
                                                    t === "white" &&
                                                        "bg-[#eef2f6]",
                                                    t === "garden" &&
                                                        "bg-[#d4e0cc]",
                                                    t === "mono" &&
                                                        "bg-[#888888]",
                                                    t === "cyberpunk" &&
                                                        "bg-[#ff2d78]",
                                                    t === "dark" &&
                                                        "bg-slate-400",
                                                )}
                                            />
                                            <div
                                                className={cn(
                                                    "h-2 w-25 rounded-lg",
                                                    t === "white" &&
                                                        "bg-[#eef2f6]",
                                                    t === "garden" &&
                                                        "bg-[#d4e0cc]",
                                                    t === "mono" &&
                                                        "bg-[#888888]",
                                                    t === "cyberpunk" &&
                                                        "bg-[#ff2d78]",
                                                    t === "dark" &&
                                                        "bg-slate-400",
                                                )}
                                            />
                                        </div>
                                        <div
                                            className={cn(
                                                "flex items-center space-x-2 rounded-md p-2 shadow-xs",
                                                t !== "dark" && "bg-white",
                                                t === "dark" && "bg-slate-800",
                                            )}>
                                            <div
                                                className={cn(
                                                    "h-4 w-4 rounded-full",
                                                    t === "white" &&
                                                        "bg-[#eef2f6]",
                                                    t === "garden" &&
                                                        "bg-[#bacfad]",
                                                    t === "mono" &&
                                                        "bg-[#888888]",
                                                    t === "cyberpunk" &&
                                                        "bg-[#c084fc]",
                                                    t === "dark" &&
                                                        "bg-slate-400",
                                                )}
                                            />
                                            <div
                                                className={cn(
                                                    "h-2 w-25 rounded-lg",
                                                    t === "white" &&
                                                        "bg-[#eef2f6]",
                                                    t === "garden" &&
                                                        "bg-[#d4e0cc]",
                                                    t === "mono" &&
                                                        "bg-[#888888]",
                                                    t === "cyberpunk" &&
                                                        "bg-[#c084fc]",
                                                    t === "dark" &&
                                                        "bg-slate-400",
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium">
                                                {meta.label}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {meta.desc}
                                            </span>
                                        </div>
                                        {active && (
                                            <span className="h-2 w-2 rounded-full bg-primary" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </FieldContent>
            </Field>

            <div className="rounded-lg border bg-card p-4">
                <h4 className="text-sm font-medium">Keyboard Shortcut</h4>
                <p className="text-xs text-muted-foreground mt-1">
                    Press{" "}
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                        D
                    </kbd>{" "}
                    anywhere in the dashboard to cycle through all themes.
                </p>
            </div>
        </div>
    );
};
