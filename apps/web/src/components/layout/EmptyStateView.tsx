import { useState } from "react";
import { UploadHero } from "../upload/UploadHero";
import type { SaveProfileRecord } from "../../types/save";
import { EntrySavedProfilesModal } from "./EntrySavedProfilesModal";

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

// supportedGameLabels lists the Gen 3 titles surfaced in the entry intro chips.
// EmptyStateView uses this so the intro can signal scope without hardcoding repeated chip markup.
const supportedGameLabels = ["Ruby", "Sapphire", "Emerald", "FireRed", "LeafGreen"];

// inlineRecentProfileLimit defines how many recent saves appear directly on the signed-in entry page.
// EmptyStateView uses this so quick resume stays compact while the full list moves into a modal.
const inlineRecentProfileLimit = 5;

// getTimestampValue converts one ISO timestamp into a safe comparable number.
// EmptyStateView uses this so recent save ordering can prefer updated profiles without crashing on bad dates.
const getTimestampValue = (value: string) => {
    const parsedTimestamp = Date.parse(value);

    if (Number.isNaN(parsedTimestamp)) {
        return 0;
    }

    return parsedTimestamp;
};

// getSortedSaveProfiles returns save profiles ordered by most recent update first.
// EmptyStateView uses this so both the inline recent slice and the full modal stay consistent.
const getSortedSaveProfiles = (saveProfiles: SaveProfileRecord[]) => {
    return saveProfiles
        .slice()
        .sort((leftSaveProfile, rightSaveProfile) => {
            return getTimestampValue(rightSaveProfile.updatedAt) - getTimestampValue(leftSaveProfile.updatedAt);
        });
};

// IntroPokeballMark renders a compact Pokeball accent beside the supported-game chips.
// EmptyStateView uses this so the intro retains a light Pokemon identity after the decorative strip is removed.
const IntroPokeballMark = () => {
    return (
        <div
            className="relative h-8 w-8 shrink-0 rounded-full border border-emerald-200 bg-white shadow-sm"
            aria-hidden="true"
        >
            <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-red-500/85" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-full bg-white" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-gray-400" />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-500 bg-white" />
            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-400" />
        </div>
    );
};

// RecentSavedProfileListItem renders one compact recent-save row for the signed-in entry sidebar.
// SavedProfilesPanel uses this so recent quick-resume items stay shorter than the full modal list rows.
const RecentSavedProfileListItem = ({
    isUploading,
    isOpeningProfile,
    saveProfile,
    onOpenExistingSave
}: {
    isUploading: boolean;
    isOpeningProfile: boolean;
    saveProfile: SaveProfileRecord;
    onOpenExistingSave: (saveProfileId: string) => void;
}) => {
    // handleOpenRecentProfile forwards the selected recent save into the shared entry open handler.
    // RecentSavedProfileListItem uses this so signed-in quick resume stays connected to the existing dashboard open flow.
    const handleOpenRecentProfile = () => {
        onOpenExistingSave(saveProfile.id);
    };

    return (
        <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleOpenRecentProfile}
            disabled={isUploading}
        >
            <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-900">
                    {saveProfile.name}
                </span>

                <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                    Updated {new Date(saveProfile.updatedAt).toLocaleDateString()}
                </span>
            </span>

            <span className="shrink-0 text-sm font-semibold text-gray-400">
                {isOpeningProfile ? "Opening..." : "Open"}
            </span>
        </button>
    );
};

// ManualEntryCard renders the manual tracker panel used in guest and signed-in entry layouts.
// EmptyStateView uses this so signed-in mode can render a shorter utility card while guest mode keeps a fuller presentation.
const ManualEntryCard = ({
    isUploading,
    isCompact,
    onCreateManualEntry
}: {
    isUploading: boolean;
    isCompact: boolean;
    onCreateManualEntry: () => void;
}) => {
    return (
        <section
            className={
                isCompact
                    ? "relative flex flex-col overflow-hidden rounded-[28px] bg-emerald-800 p-4 text-white shadow-sm"
                    : "relative flex min-h-[240px] flex-col overflow-hidden rounded-[28px] bg-emerald-800 p-6 text-white shadow-sm sm:p-7"
            }
        >
            <div className="absolute inset-x-auto bottom-0 right-0 h-24 w-24 rounded-tl-[32px] border-l border-t border-white/10 bg-white/5" />

            <div className="relative z-10 flex h-full flex-col">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-100">
                    Manual Entry
                </p>

                <h2 className={isCompact ? "mt-2 text-xl font-extrabold tracking-tight" : "mt-3 text-3xl font-extrabold tracking-tight"}>
                    {isCompact ? "Start blank." : "Start without a save file."}
                </h2>

                <p className={isCompact ? "mt-2 text-[14px] leading-6 text-emerald-50/90" : "mt-4 max-w-[260px] text-[15px] leading-7 text-emerald-50/90"}>
                    {isCompact ? "Create a blank tracker from scratch." : "Create a blank tracker from scratch."}
                </p>

                <button
                    type="button"
                    className="mt-4 inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={onCreateManualEntry}
                    disabled={isUploading}
                >
                    Create Blank Tracker
                </button>
            </div>
        </section>
    );
};

// SavedProfilesPanel renders the signed-in recent-profiles panel used for compact quick resume.
// EmptyStateView uses this so the signed-in sidebar prioritizes recent saves while the full list stays in a modal.
const SavedProfilesPanel = ({
    isLoadingSaveProfiles,
    isUploading,
    openingSaveProfileId,
    recentSaveProfiles,
    totalSaveProfileCount,
    onOpenExistingSave,
    onOpenAllProfiles
}: {
    isLoadingSaveProfiles: boolean;
    isUploading: boolean;
    openingSaveProfileId: string | null;
    recentSaveProfiles: SaveProfileRecord[];
    totalSaveProfileCount: number;
    onOpenExistingSave: (saveProfileId: string) => void;
    onOpenAllProfiles: () => void;
}) => {
    return (
        <aside className="rounded-[28px] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                            Recent Profiles
                        </p>

                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">
                            Resume a tracker
                        </h2>
                    </div>

                    {totalSaveProfileCount > 0 ? (
                        <button
                            type="button"
                            className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            onClick={onOpenAllProfiles}
                            disabled={isUploading}
                        >
                            View all
                        </button>
                    ) : null}
                </div>

                {isLoadingSaveProfiles ? (
                    <p className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        Loading saved profiles...
                    </p>
                ) : recentSaveProfiles.length > 0 ? (
                    <div className="grid gap-3">
                        {recentSaveProfiles.map((saveProfile) => {
                            return (
                                <RecentSavedProfileListItem
                                    key={saveProfile.id}
                                    isUploading={isUploading}
                                    isOpeningProfile={openingSaveProfileId === saveProfile.id}
                                    saveProfile={saveProfile}
                                    onOpenExistingSave={onOpenExistingSave}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <p className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        No saved profiles yet.
                    </p>
                )}
            </div>
        </aside>
    );
};

// EmptyStateView renders the structured entry content for intro, upload, manual setup, and saved-profile reopening.
// EntryView composes this so the pre-dashboard page stays tool-first while signed-in and guest layouts can prioritize different actions.
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
    const [isSavedProfilesModalOpen, setIsSavedProfilesModalOpen] = useState(false);
    // sortedSaveProfiles stores the complete save-profile list ordered by most recent update.
    // EmptyStateView uses this so the inline recent slice and modal browser stay aligned.
    const sortedSaveProfiles = getSortedSaveProfiles(saveProfiles);
    // recentSaveProfiles stores the compact signed-in quick-resume slice shown inline on the entry page.
    // EmptyStateView derives this from the full profile list so the right column stays short by default.
    const recentSaveProfiles = sortedSaveProfiles.slice(0, inlineRecentProfileLimit);

    // openSavedProfilesModal shows the entry-only full saved-profiles browser.
    // SavedProfilesPanel uses this so signed-in users can still reach every saved profile without stretching the page.
    const openSavedProfilesModal = () => {
        setIsSavedProfilesModalOpen(true);
    };

    // closeSavedProfilesModal hides the entry-only full saved-profiles browser.
    // EntrySavedProfilesModal uses this so overlay dismissal and close-button dismissal share one handler.
    const closeSavedProfilesModal = () => {
        setIsSavedProfilesModalOpen(false);
    };

    return (
        <>
            <div className="min-w-0 overflow-x-hidden">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="grid min-w-0 gap-5">
                        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-[520px]">
                                    <h1 className="max-w-[9ch] text-3xl font-extrabold tracking-tight text-gray-950 sm:text-[34px]">
                                        Start your tracker
                                    </h1>

                                    <p className="mt-3 max-w-[460px] text-[15px] leading-7 text-gray-600">
                                        Upload a Gen 3 save or start from scratch.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 lg:justify-end">
                                    <IntroPokeballMark />

                                    <div className="flex max-w-[320px] flex-wrap gap-2">
                                        {supportedGameLabels.map((supportedGameLabel) => {
                                            return (
                                                <span
                                                    key={supportedGameLabel}
                                                    className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-800"
                                                >
                                                    {supportedGameLabel}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <UploadHero
                            isUploading={isUploading}
                            showsReplacementCopy={false}
                            errorMessage={errorMessage}
                            onSelectUploadFile={onSelectUploadFile}
                            onUploadError={onUploadError}
                        />
                    </div>

                    <div className="grid gap-5 content-start">
                        {isSignedIn ? (
                            <>
                                <SavedProfilesPanel
                                    isLoadingSaveProfiles={isLoadingSaveProfiles}
                                    isUploading={isUploading}
                                    openingSaveProfileId={openingSaveProfileId}
                                    recentSaveProfiles={recentSaveProfiles}
                                    totalSaveProfileCount={saveProfiles.length}
                                    onOpenExistingSave={onOpenExistingSave}
                                    onOpenAllProfiles={openSavedProfilesModal}
                                />

                                <ManualEntryCard
                                    isUploading={isUploading}
                                    isCompact={true}
                                    onCreateManualEntry={onCreateManualEntry}
                                />
                            </>
                        ) : (
                            <>
                                <ManualEntryCard
                                    isUploading={isUploading}
                                    isCompact={false}
                                    onCreateManualEntry={onCreateManualEntry}
                                />

                                <section className="rounded-[28px] border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
                                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                                        Upload Notes
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-emerald-950/80">
                                        Save files are processed from the entry flow first, then the tracker opens with the imported progress.
                                    </p>
                                </section>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <EntrySavedProfilesModal
                isOpen={isSavedProfilesModalOpen}
                isUploading={isUploading}
                openingSaveProfileId={openingSaveProfileId}
                saveProfiles={sortedSaveProfiles}
                onOpenExistingSave={onOpenExistingSave}
                onClose={closeSavedProfilesModal}
            />
        </>
    );
};
