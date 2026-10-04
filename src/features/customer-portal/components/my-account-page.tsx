import { SectionHeader } from "@/components/shared/section-header";
import { Separator } from "@/components/ui/separator";
import { AccountFormSection } from "@/features/settings/components/account-form-section";
import { ProfileFormSection } from "@/features/settings/components/profile-form-section";
import { useSession } from "@/lib/auth-client";

export function MyAccountPage() {
    const { data: session } = useSession();

    if (!session?.user) return null;

    const user = {
        id: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role ?? "visitor",
        image: session.user.image ?? null,
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Akun"
                subtitle="Ubah nama dan password akun kamu."
            />
            <Separator />
            <div className="w-full lg:max-w-xl">
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Nama ini ditampilkan di pesanan dan profil member kamu.
                </p>
                <div className="mt-4">
                    <ProfileFormSection user={user} />
                </div>
            </div>
            <Separator />
            <div className="w-full lg:max-w-xl">
                <h3 className="text-lg font-medium">Password</h3>
                <p className="text-sm text-muted-foreground">
                    Perbarui password untuk keamanan akun kamu.
                </p>
                <div className="mt-4">
                    <AccountFormSection />
                </div>
            </div>
        </div>
    );
}
