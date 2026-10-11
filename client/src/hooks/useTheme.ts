import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * Keyboard shortcut untuk cycle theme: tekan tombol `D`.
 * Cycle urutan: white → garden → dark → white → ...
 * Render null — no UI.
 */
export const ThemeShortcut = () => {
    const { theme, setTheme, themes } = useTheme();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.isContentEditable ||
                target.closest(
                    "input, textarea, select, button, a[href], [tabindex]:not([tabindex='-1'])",
                )
            ) {
                return;
            }

            if (
                e.key.toLowerCase() === "d" &&
                !e.ctrlKey &&
                !e.metaKey &&
                !e.altKey
            ) {
                e.preventDefault();
                const currentTheme = theme ?? "white";
                const currentIndex = themes.indexOf(currentTheme);
                const nextIndex =
                    currentIndex < themes.length - 1 ? currentIndex + 1 : 0;
                setTheme(themes[nextIndex]);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [theme, setTheme, themes]);

    return null;
};
