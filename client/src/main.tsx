import { TanStackDevtools } from "@tanstack/react-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeShortcut } from "@/hooks/useTheme";
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";
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
        <TanStackDevtools
            config={{ position: "bottom-right" }}
            plugins={[
                {
                    name: "Tanstack Router",
                    render: <TanStackRouterDevtoolsPanel />,
                },
                TanStackQueryDevtools,
            ]}
        />
    </StrictMode>,
);
