import { UploadHero } from "../upload/UploadHero";
import type { DexResponse, UploadResponse } from "../../types/save";

type EmptyStateViewProps = {
    isUploading: boolean;
    errorMessage: string;
    onUploadStart: () => void;
    onUploadSuccess: (
        uploadResponse: UploadResponse,
        dexResponse: DexResponse
    ) => void;
    onUploadError: (errorMessage: string) => void;
};

export const EmptyStateView = ({
    isUploading,
    errorMessage,
    onUploadStart,
    onUploadSuccess,
    onUploadError
}: EmptyStateViewProps) => {
    return (
        <main className="min-h-screen bg-[#f3f4f6] px-6 py-8">
            <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1400px] items-center justify-center">
                <UploadHero
                    isUploading={isUploading}
                    errorMessage={errorMessage}
                    onUploadStart={onUploadStart}
                    onUploadSuccess={onUploadSuccess}
                    onUploadError={onUploadError}
                />
            </div>
        </main>
    );
};