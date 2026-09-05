import { LandingBranches } from "@/features/landing/components/landing-branches";
import { LandingFeatures } from "@/features/landing/components/landing-features";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingHero } from "@/features/landing/components/landing-hero";
import { LandingMenu } from "@/features/landing/components/landing-menu";
import { LandingNavbar } from "@/features/landing/components/landing-navbar";
import { LandingStats } from "@/features/landing/components/landing-stats";
import { LandingTestimonials } from "@/features/landing/components/landing-testimonials";
import {
    usePublicBranches,
    usePublicMenu,
} from "@/features/landing/hooks/useLandingQueries";

export const LandingPage = () => {
    const branchesQuery = usePublicBranches();
    const menuQuery = usePublicMenu();

    const branches =
        branchesQuery.data.success === true ? branchesQuery.data.data : [];
    const menuItems =
        menuQuery.data.success === true ? menuQuery.data.data : [];
    const categoryCount = new Set(menuItems.map((item) => item.categoryId))
        .size;

    return (
        <div className="min-h-svh bg-background">
            <LandingNavbar />
            <main>
                <LandingHero branchCount={branches.length} />
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
