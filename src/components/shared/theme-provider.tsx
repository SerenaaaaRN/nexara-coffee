import { ThemeProvider as NextThemesProvider } from "next-themes";

import type { ReactNode } from "react";

const THEMES = ["white", "garden", "mono", "cyberpunk", "dark"] as const;

export function ThemeProvider({ children }: { children: ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="garden"
            enableSystem={false}
            themes={[...THEMES]}>
            {children}
        </NextThemesProvider>
    );
}
