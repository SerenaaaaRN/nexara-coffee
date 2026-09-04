import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageUploadProps {
    onUpload?: (file: File, url: string) => void;
    maxSizeMB?: number;
    allowedTypes?: string[];
}

/**
 * Mengelola upload gambar: validasi tipe/ukuran, preview via ObjectURL,
 * konversi ke base64, dan reset state. Dipakai bersama hidden file input
 * dan thumbnail click trigger di komponen form.
 */
export function useImageUpload({
    onUpload,
    maxSizeMB = 5,
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
}: UseImageUploadProps = {}) {
    /** Menyimpan URL preview agar bisa di-revoke saat cleanup. */
    const previewRef = useRef<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    /** Revoke ObjectURL saat komponen unmount untuk mencegah memory leak. */
    useEffect(() => {
        return () => {
            if (previewRef.current) {
                URL.revokeObjectURL(previewRef.current);
                previewRef.current = null;
            }
        };
    }, []);

    /** Validasi tipe file dan ukuran sebelum diproses. */
    const validateFile = useCallback(
        (file: File): string | null => {
            if (!allowedTypes.includes(file.type)) {
                return `Tipe file tidak didukung. Gunakan: ${allowedTypes.join(", ")}`;
            }

            const maxSizeBytes = maxSizeMB * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                return `Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB`;
            }

            return null;
        },
        [allowedTypes, maxSizeMB],
    );

    /** Konversi file terpilih ke base64 (tanpa prefix data URI). */
    const toBase64 = useCallback(async (): Promise<string> => {
        if (!selectedFile) throw new Error("No file selected");
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
        });
    }, [selectedFile]);

    /** Reset semua state, revoke ObjectURL, kosongkan file input. */
    const resetFile = useCallback(() => {
        if (previewRef.current) {
            URL.revokeObjectURL(previewRef.current);
            previewRef.current = null;
        }
        setPreviewUrl(null);
        setFileName(null);
        setError(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, []);

    /** Trigger hidden file input (biasanya dari klik thumbnail). */
    const handleThumbnailClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    /** Proses file yang dipilih user: validasi → preview → panggil onUpload. */
    const handleFileChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            setError(null);

            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }

            setIsUploading(true);

            try {
                if (previewRef.current) {
                    URL.revokeObjectURL(previewRef.current);
                }

                const url = URL.createObjectURL(file);
                setFileName(file.name);
                setPreviewUrl(url);
                setSelectedFile(file);
                previewRef.current = url;

                onUpload?.(file, url);
            } catch {
                setError("Gagal memproses gambar");
            } finally {
                setIsUploading(false);
            }
        },
        [onUpload, validateFile],
    );

    /** Hapus file terpilih dan reset preview. */
    const handleRemove = useCallback(() => {
        resetFile();
    }, [resetFile]);

    return {
        previewUrl,
        fileName,
        error,
        isUploading,
        selectedFile,
        fileInputRef,
        handleThumbnailClick,
        handleFileChange,
        handleRemove,
        toBase64,
        resetFile,
    };
}
