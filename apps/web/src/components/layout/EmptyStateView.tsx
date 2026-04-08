import { UploadHero } from "../upload/UploadHero";
import type { SaveProfileRecord } from "../../types/save";
import { getDisplayGameLabel } from "../../lib/getDisplayGameLabel";

type EmptyStateViewProps = {
    isSignedIn: boolean;
    isUploading: boolean;
    isLoadingSaveProfiles: boolean;
    openingSaveProfileId: string | null;
    errorMessage: string;
    saveProfiles: SaveProfileRecord[];
    onSelectUploadFile: (file: File) => void;
    onCreateManualEntry: () => void;
    onOpenExistingSave: (saveProfileId: string) => void;
    onUploadError: (errorMessage: string) => void;
};

// EmptyStateView renders the left-column entry content for upload and manual creation.
// EntryView composes this inside the shared page shell so nested full-screen spacing does not push the content below the auth panel.
export const EmptyStateView = ({
    isSignedIn,
    isUploading,
    isLoadingSaveProfiles,
    openingSaveProfileId,
    errorMessage,
    saveProfiles,
    onSelectUploadFile,
    onCreateManualEntry,
    onOpenExistingSave,
    onUploadError
}: EmptyStateViewProps) => {
    return (
        <div className="min-w-0 overflow-x-hidden xl:h-full">
            <div className={`grid items-start gap-4 ${isSignedIn ? "xl:grid-cols-[320px_minmax(0,1fr)]" : ""}`}>
                {isSignedIn ? (
                    <aside className="self-start rounded-2xl bg-white p-3 shadow-sm xl:sticky xl:top-4 xl:flex xl:flex-col">
                        <div className="flex flex-col gap-3 pb-3 xl:max-h-[calc(100vh-32px)] xl:overflow-y-auto xl:pr-1">
                            <div className="grid gap-3 rounded-xl bg-gray-50 p-3">
                                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                                    Saved profiles
                                </p>

                                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                                    Open a saved profile
                                </h2>
                            </div>

                            {isLoadingSaveProfiles ? (
                                <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                    Loading saved profiles...
                                </p>
                            ) : saveProfiles.length > 0 ? (
                                saveProfiles.map((saveProfile) => {
                                    const isOpeningProfile = openingSaveProfileId === saveProfile.id;
                                    const gameLabel = getDisplayGameLabel({
                                        detectedGame: null,
                                        detectedLayout: undefined,
                                        saveProfileGame: saveProfile.game,
                                        unknownLabel: "Unknown Game"
                                    });

                                    return (
                                        <button
                                            key={saveProfile.id}
                                            type="button"
                                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            onClick={() => {
                                                onOpenExistingSave(saveProfile.id);
                                            }}
                                            disabled={isUploading}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-semibold text-gray-900">
                                                    {saveProfile.name}
                                                </span>
                                                <span className="mt-1 block text-xs font-medium uppercase tracking-[0.08em] text-gray-500">
                                                    {gameLabel}
                                                </span>
                                            </span>

                                            <span className="shrink-0 text-sm font-semibold text-gray-400">
                                                {isOpeningProfile ? "Opening..." : ">"}
                                            </span>
                                        </button>
                                    );
                                })
                            ) : (
                                <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                    No saved profiles yet.
                                </p>
                            )}
                        </div>
                    </aside>
                ) : null}

                <div className="grid min-w-0 gap-4 xl:h-full xl:grid-rows-[auto_minmax(0,1fr)]">
                    <UploadHero
                        isUploading={isUploading}
                        showsReplacementCopy={false}
                        errorMessage={errorMessage}
                        onSelectUploadFile={onSelectUploadFile}
                        onUploadError={onUploadError}
                    />

                    <section className="flex min-h-[220px] flex-col rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                            Manual Entry
                        </p>

                        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900">
                            Start without a save file
                        </h2>

                        <p className="mt-3 text-[15px] leading-6 text-gray-600">
                            Create a blank tracker
                        </p>

                        <button
                            type="button"
                            className="mt-auto inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            onClick={onCreateManualEntry}
                            disabled={isUploading}
                        >
                            Create tracker
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};
