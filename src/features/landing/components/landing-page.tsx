import { LandingBranches } from "@/features/landing/components/landing-branches";
import { LandingFeatures } from "@/features/landing/components/landing-features";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingHero } from "@/features/landing/components/landing-hero";
import { LandingMarquee } from "@/features/landing/components/landing-marquee";
import { LandingMenu } from "@/features/landing/components/landing-menu";
import { LandingNavbar } from "@/features/landing/components/landing-navbar";
import { LandingStats } from "@/features/landing/components/landing-stats";
import { LandingTestimonials } from "@/features/landing/components/landing-testimonials";
import {
    usePublicBranches,
    usePublicMenu,
} from "@/features/landing/hooks/useLandingQueries";

const formatHours = (
    opening: string | null,
    closing: string | null,
): string | null => {
    if (!opening || !closing) return null;
    return `${opening.slice(0, 5)}–${closing.slice(0, 5)}`;
};

export const LandingPage = () => {
    const branchesQuery = usePublicBranches();
    const menuQuery = usePublicMenu();

    const branches =
        branchesQuery.data.success === true ? branchesQuery.data.data : [];
    const menuItems =
        menuQuery.data.success === true ? menuQuery.data.data : [];
    const categoryCount = new Set(menuItems.map((item) => item.categoryId))
        .size;

    const first = branches[0];
    const branchLine = first
        ? `${first.name}${
              formatHours(first.openingTime, first.closingTime)
                  ? ` · ${formatHours(first.openingTime, first.closingTime)}`
                  : ""
          }`
        : null;

    return (
        <div className="landing-grain min-h-svh bg-background text-foreground">
            <LandingNavbar />
            <main>
                <LandingHero
                    branchCount={branches.length}
                    branchLine={branchLine}
                />
                <LandingMarquee />
                <LandingStats
                    branchCount={branches.length}
                    menuCount={menuItems.length}
                    categoryCount={categoryCount}
                />
                <LandingFeatures />
                <LandingMenu items={menuItems} />
                <LandingBranches branches={branches} />
                <LandingTestimonials />
            </main>
            <LandingFooter />
        </div>
    );
};
