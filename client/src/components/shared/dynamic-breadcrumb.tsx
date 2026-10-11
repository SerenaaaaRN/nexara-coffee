import { Link, useLocation } from "@tanstack/react-router";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function segmentToLabel(segment: string): string {
    return segment
        .split("-")
        .map((word) => {
            if (word.length <= 2) return word.toUpperCase();
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

export function DynamicBreadcrumb() {
    const location = useLocation();
    const pathname = location.pathname;
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
        return (
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Dashboard</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/">Dashboard</Link>} />
                </BreadcrumbItem>
                {segments.map((segment, index) => {
                    const href = `/${segments.slice(0, index + 1).join("/")}`;
                    const label = segmentToLabel(segment);
                    const isLast = index === segments.length - 1;

                    return (
                        <span key={segment} className="contents">
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink
                                        render={<Link to={href}>{label}</Link>}
                                    />
                                )}
                            </BreadcrumbItem>
                        </span>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
