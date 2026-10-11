import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeShortcut } from "@/hooks/useTheme";
import TanstackQueryProvider from "@/integrations/tanstack-query/root-provider";
import { getRouter } from "@/router";
import "@/styles.css";

const router = getRouter();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

createRoot(rootEl).render(
    <StrictMode>
        <ThemeProvider>
            <TanstackQueryProvider>
                <ThemeShortcut />
                <TooltipProvider>
                    <RouterProvider router={router} />
                </TooltipProvider>
                <Toaster />
            </TanstackQueryProvider>
        </ThemeProvider>
    </StrictMode>,
);
