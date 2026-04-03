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
        <main className="relative min-h-screen overflow-hidden bg-[#ffffd3] px-6 py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,152,0,0.08),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(249,229,52,0.10),transparent_24%),radial-gradient(circle_at_50%_80%,rgba(255,147,133,0.10),transparent_24%)]" />
            <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center">
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