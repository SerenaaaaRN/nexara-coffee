import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useUpdateMyPhone } from "@/features/customer-portal/hooks/useCustomerPortalMutations";
import { useMyLoyalty } from "@/features/customer-portal/hooks/useCustomerPortalQueries";
import type { UpdateMyPhoneInput } from "@/features/customer-portal/types";
import { updateMyPhoneSchema } from "@/features/customer-portal/types";
import { AccountFormSection } from "@/features/settings/components/account-form-section";
import { ProfileFormSection } from "@/features/settings/components/profile-form-section";
import { useSession } from "@/lib/auth-client";

export const MyPhoneFormSection = ({
    initialPhone,
}: {
    initialPhone: string;
}) => {
    const updatePhone = useUpdateMyPhone();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateMyPhoneInput>({
        resolver: zodResolver(updateMyPhoneSchema),
        defaultValues: { phone: initialPhone },
    });

    const onSubmit = async (values: UpdateMyPhoneInput) => {
        const res = await updatePhone.mutateAsync(values).catch(() => null);
        if (res?.success) {
            toast.success("Nomor HP berhasil diperbarui");
            reset({ phone: res.data.phone });
        } else {
            toast.error(
                typeof res?.error === "string"
                    ? res.error
                    : "Gagal memperbarui nomor HP",
            );
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="phone">Nomor HP</FieldLabel>
                <FieldContent>
                    <Input
                        id="phone"
                        inputMode="tel"
                        placeholder="08xxxxxxxxxx"
                        aria-invalid={!!errors.phone}
                        {...register("phone")}
                    />
                    <FieldDescription>
                        Nomor ini dipakai kasir untuk mengenali kamu sebagai
                        member.
                    </FieldDescription>
                    <FieldError errors={[errors.phone]} />
                </FieldContent>
            </Field>

            <Button type="submit" disabled={updatePhone.isPending}>
                {updatePhone.isPending ? "Menyimpan..." : "Simpan Nomor HP"}
            </Button>
        </form>
    );
};

export function MyAccountPage() {
    const { data: session } = useSession();
    const loyaltyQuery = useMyLoyalty();

    if (!session?.user) return null;

    const user = {
        id: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role ?? "visitor",
        image: session.user.image ?? null,
    };

    const currentPhone =
        loyaltyQuery.data?.success
            ? (loyaltyQuery.data.data.phone ?? "")
            : "";

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
                <h3 className="text-lg font-medium">Nomor HP</h3>
                <p className="text-sm text-muted-foreground">
                    Ubah nomor HP untuk akun member kamu.
                </p>
                <div className="mt-4">
                    <MyPhoneFormSection initialPhone={currentPhone} />
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
