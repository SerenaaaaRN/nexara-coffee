import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
    createRootRouteWithContext,
    HeadContent,
    Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ErrorPage, NotFoundPage } from "@/components/fallbacks/error-page";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeShortcut } from "@/hooks/useTheme";
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";
import TanstackQueryProvider from "@/integrations/tanstack-query/root-provider";
import appCss from "@/styles.css?url";

interface MyRouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
    head: () => ({
        meta: [
            {
                charSet: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            {
                title: "Nexara Coffee",
            },
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss,
            },
        ],
    }),
    notFoundComponent: () => <NotFoundPage />,
    errorComponent: ErrorPage,
    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="h-full antialiased" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body className="min-h-full flex flex-col">
                <ThemeProvider>
                    <TanstackQueryProvider>
                        <ThemeShortcut />
                        <TooltipProvider>{children}</TooltipProvider>
                        <Toaster />
                    </TanstackQueryProvider>
                </ThemeProvider>
                <TanStackDevtools
                    config={{
                        position: "bottom-right",
                    }}
                    plugins={[
                        {
                            name: "Tanstack Router",
                            render: <TanStackRouterDevtoolsPanel />,
                        },
                        TanStackQueryDevtools,
                    ]}
                />
                <Scripts />
            </body>
        </html>
    );
}
