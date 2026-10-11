import { Link } from "@tanstack/react-router";
import { AlertTriangle, Home } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export function ErrorPage({
    error,
    children,
}: {
    error: Error;
    children?: ReactNode;
}) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Card className="w-105">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="size-5" />
                        Something went wrong
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {error.message}
                    </p>
                </CardContent>
                <CardFooter className="justify-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}>
                        Try again
                    </Button>
                    {children}
                </CardFooter>
            </Card>
        </div>
    );
}

export function NotFoundPage({ to = "/" }: { to?: string }) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Card className="w-95 text-center">
                <CardHeader>
                    <CardTitle className="text-6xl font-bold text-muted-foreground">
                        404
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg font-semibold">Page not found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        The page you are looking for does not exist or has been
                        moved.
                    </p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button
                        render={
                            <Link to={to}>
                                <Home />
                                {to === "/" ? "Go home" : "Go to Overview"}
                            </Link>
                        }
                    />
                </CardFooter>
            </Card>
        </div>
    );
}
