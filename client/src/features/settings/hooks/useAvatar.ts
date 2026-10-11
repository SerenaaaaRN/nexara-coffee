import { useCallback, useState } from "react";
import {
    useRemoveAvatar,
    useUploadAvatar,
} from "@/features/settings/hooks/useSettingsMutations";
import { useImageUpload } from "@/hooks/useImageUpload";

export const useAvatar = (initialImage: string | null) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialImage);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

    const uploadAvatar = useUploadAvatar();
    const removeAvatar = useRemoveAvatar();

    const {
        previewUrl: localPreview,
        selectedFile,
        isUploading,
        fileInputRef,
        handleThumbnailClick,
        handleFileChange,
        toBase64,
        resetFile,
    } = useImageUpload();

    const previewUrl = selectedFile ? localPreview : avatarUrl;

    const isPending =
        isUploading || uploadAvatar.isPending || removeAvatar.isPending;

    const handleSave = useCallback(async () => {
        if (!selectedFile) return;
        const base64 = await toBase64();
        uploadAvatar.mutate(
            { base64 },
            {
                onSuccess: (res) => {
                    if (res.success && res.data) {
                        setAvatarUrl(res.data.url);
                        resetFile();
                    }
                },
            },
        );
    }, [selectedFile, toBase64, uploadAvatar, resetFile]);

    const handleCancel = useCallback(() => {
        resetFile();
    }, [resetFile]);

    const handleRemove = useCallback(() => {
        removeAvatar.mutate(undefined, {
            onSuccess: (res) => {
                if (res.success) {
                    setAvatarUrl(null);
                    setShowRemoveConfirm(false);
                }
            },
        });
    }, [removeAvatar]);

    return {
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
    };
};
