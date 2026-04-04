import { UploadHero } from "../upload/UploadHero";

type EmptyStateViewProps = {
    isUploading: boolean;
    errorMessage: string;
    onUploadStart: () => void;
    onUploadFile: (file: File, saveProfileName: string) => Promise<void>;
    onUploadError: (errorMessage: string) => void;
};

export const EmptyStateView = ({
    isUploading,
    errorMessage,
    onUploadStart,
    onUploadFile,
    onUploadError
}: EmptyStateViewProps) => {
    return (
        <main className="min-h-screen bg-[#f3f4f6] px-6 py-8">
            <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1400px] items-center justify-center">
                <UploadHero
                    isUploading={isUploading}
                    errorMessage={errorMessage}
                    onUploadStart={onUploadStart}
                    onUploadFile={onUploadFile}
                    onUploadError={onUploadError}
                />
            </div>
        </main>
    );
};