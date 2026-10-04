import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAvatar } from "@/features/settings/hooks/useAvatar";
import { useUpdateProfile } from "@/features/settings/hooks/useSettingsMutations";
import type { ProfileFormValues } from "@/features/settings/types";
import { profileSchema } from "@/features/settings/types";
import { formatLabel } from "@/utils/format";

type ProfileUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
};

type ProfileFormSectionProps = {
    user: ProfileUser;
};

export const ProfileFormSection = ({ user }: ProfileFormSectionProps) => {
    const updateProfile = useUpdateProfile();
    const {
        previewUrl,
        isPending,
        selectedFile,
        fileInputRef,
        handleThumbnailClick,
        handleFileChange,
        handleSave,
        handleCancel,
        handleRemove,
        showRemoveConfirm,
        setShowRemoveConfirm,
    } = useAvatar(user.image);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: user.name ?? "" },
    });

    const onSubmit = (data: ProfileFormValues) => {
        updateProfile.mutate(data);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex items-start gap-6">
                <div className="relative">
                    <Avatar
                        className={`h-20 w-20 rounded-xl ${selectedFile ? "" : "cursor-pointer"}`}
                        onClick={
                            selectedFile ? undefined : handleThumbnailClick
                        }>
                        {previewUrl ? (
                            <AvatarImage
                                src={previewUrl}
                                alt={user.name}
                                className="rounded-xl object-cover"
                            />
                        ) : (
                            <AvatarFallback className="rounded-xl text-2xl">
                                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                            </AvatarFallback>
                        )}
                    </Avatar>

                    {isPending ? (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60">
                            <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : null}

                    {!isPending && !selectedFile ? (
                        <button
                            type="button"
                            onClick={handleThumbnailClick}
                            className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs ring-2 ring-background">
                            <Camera className="size-3" />
                        </button>
                    ) : null}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isPending}
                    />
                </div>

                <div className="flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleThumbnailClick}
                            disabled={isPending}>
                            Choose Picture
                        </Button>
                        {previewUrl && !selectedFile ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setShowRemoveConfirm(true)}
                                disabled={isPending}>
                                Remove
                            </Button>
                        ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        JPEG, PNG, WebP or GIF. Max 5MB.
                    </p>

                    {selectedFile ? (
                        <div className="flex items-center gap-2 mt-1">
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSave}
                                disabled={isPending}>
                                {isPending ? "Uploading..." : "Save Avatar"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                disabled={isPending}>
                                Cancel
                            </Button>
                        </div>
                    ) : null}
                </div>
            </div>

            <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel>Name</FieldLabel>
                        <FieldContent>
                            <Input placeholder="Your name" {...field} />
                            <FieldDescription>
                                This is your public display name.
                            </FieldDescription>
                            <FieldError
                                errors={
                                    fieldState.error ? [fieldState.error] : []
                                }
                            />
                        </FieldContent>
                    </Field>
                )}
            />

            {showRemoveConfirm ? (
                <AlertDialog
                    open
                    onOpenChange={(o) => {
                        if (!o) setShowRemoveConfirm(false);
                    }}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove avatar?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Your profile picture will be removed. You can
                                upload a new one anytime.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                onClick={() => setShowRemoveConfirm(false)}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleRemove}>
                                Remove
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : null}

            <Field>
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                    <Input
                        value={user.email ?? ""}
                        disabled
                        className="text-muted-foreground"
                    />
                    <FieldDescription>
                        Email tidak bisa diubah melalui settings.
                    </FieldDescription>
                </FieldContent>
            </Field>

            <Field>
                <FieldLabel>Role</FieldLabel>
                <FieldContent>
                    <Input
                        value={formatLabel(user.role)}
                        disabled
                        className="text-muted-foreground"
                    />
                    <FieldDescription>
                        Role ditetapkan oleh administrator.
                    </FieldDescription>
                </FieldContent>
            </Field>

            <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Menyimpan..." : "Save Changes"}
            </Button>
        </form>
    );
};
