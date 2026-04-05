import { UploadHero } from "../upload/UploadHero";

type EmptyStateViewProps = {
    isUploading: boolean;
    errorMessage: string;
    onSelectUploadFile: (file: File) => void;
    onCreateManualEntry: () => void;
    onUploadError: (errorMessage: string) => void;
};

// EmptyStateView renders the no-save landing state for upload and manual creation.
// App.tsx uses this so setup entry points stay separate from loaded dashboard rendering.
export const EmptyStateView = ({
    isUploading,
    errorMessage,
    onSelectUploadFile,
    onCreateManualEntry,
    onUploadError
}: EmptyStateViewProps) => {
    return (
        <main className="min-h-screen bg-[#f3f4f6] px-6 py-8">
            <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1400px] items-center gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <UploadHero
                    isUploading={isUploading}
                    errorMessage={errorMessage}
                    onSelectUploadFile={onSelectUploadFile}
                    onUploadError={onUploadError}
                />

                <aside className="rounded-2xl bg-white p-6 shadow-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                        Manual Entry
                    </p>

                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                        Create a blank tracker shell
                    </h2>

                    <p className="mt-3 text-[15px] leading-6 text-gray-600">
                        Start without a save file by choosing a game, save name, and trainer name. The dashboard will open with an empty dex template that the rest of the app can use immediately.
                    </p>

                    <button
                        type="button"
                        className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#6b7a34] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5a672b] disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={onCreateManualEntry}
                        disabled={isUploading}
                    >
                        Create Manual Entry
                    </button>
                </aside>
            </div>
        </main>
    );
};
