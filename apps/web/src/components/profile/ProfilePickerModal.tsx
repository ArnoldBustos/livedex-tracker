import { useState } from "react";

import { getDisplayGameLabel } from "../../lib/getDisplayGameLabel";
import type { SaveProfileRecord } from "../../types/save";

type ProfilePickerModalProps = {
    isOpen: boolean;
    saveProfiles: SaveProfileRecord[];
    activeSaveProfileId: string | null;
    openingSaveProfileId: string | null;
    isBusy: boolean;
    onClose: () => void;
    onSelectSaveProfile: (saveProfileId: string) => Promise<void> | void;
    onDeleteProfile: (saveProfileId: string) => Promise<void>;
    onOpenEntryOptions: () => void;
};

// ProfilePickerListItemProps defines the profile row actions used inside the picker modal.
// ProfilePickerModal maps saved profiles into this row component so selection and deletion stay modular.
type ProfilePickerListItemProps = {
    saveProfile: SaveProfileRecord;
    isActiveProfile: boolean;
    isOpeningProfile: boolean;
    isPendingDelete: boolean;
    isBusy: boolean;
    onSelect: () => Promise<void>;
    onRequestDelete: () => void;
    onCancelDelete: () => void;
    onConfirmDelete: () => Promise<void>;
};

// ProfilePickerListItem renders one saved-profile row with select and delete actions.
// ProfilePickerModal uses this so the saved-profile markup is isolated from the shell layout.
const ProfilePickerListItem = ({
    saveProfile,
    isActiveProfile,
    isOpeningProfile,
    isPendingDelete,
    isBusy,
    onSelect,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete
}: ProfilePickerListItemProps) => {
    // gameLabel resolves the display label for one saved profile's configured game.
    // ProfilePickerListItem uses this so active and inactive rows share the same game formatting.
    const gameLabel = getDisplayGameLabel({
        detectedGame: null,
        detectedLayout: undefined,
        saveProfileGame: saveProfile.game,
        unknownLabel: "Unknown Game"
    });

    return (
        <div
            className={
                isActiveProfile
                    ? "rounded-2xl border border-[rgba(147,86,0,0.3)] bg-white p-4 shadow-sm"
                    : "rounded-2xl border border-[rgba(130,129,111,0.12)] bg-white/90 p-4"
            }
        >
            <button
                className="flex w-full flex-col items-start text-left transition disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={onSelect}
                disabled={isBusy || isActiveProfile}
            >
                <div className="w-full truncate text-base font-extrabold text-[#38392a]">
                    {saveProfile.name}
                </div>

                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#935600]">
                    {gameLabel}
                </div>

                <div className="mt-2 text-[11px] text-[#656554]">
                    {isActiveProfile ? "Active profile" : "Saved profile"}
                </div>
            </button>

            {!isPendingDelete ? (
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[rgba(130,129,111,0.1)] pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a8b78]">
                        {isOpeningProfile ? "Opening..." : isActiveProfile ? "Loaded now" : "Available"}
                    </span>

                    <div className="flex items-center gap-2">
                        {!isActiveProfile ? (
                            <button
                                className="rounded-lg border border-[rgba(130,129,111,0.18)] bg-white px-3 py-2 text-[11px] font-medium text-[#38392a] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                type="button"
                                onClick={onSelect}
                                disabled={isBusy}
                            >
                                Open
                            </button>
                        ) : null}

                        <button
                            className="rounded-lg px-3 py-2 text-[11px] font-medium text-[#8a8b78] transition hover:bg-red-50 hover:text-[#912018] disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            onClick={onRequestDelete}
                            disabled={isBusy}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-3 border-t border-[rgba(130,129,111,0.1)] pt-3">
                    <div className="rounded-xl border border-red-100 bg-[rgba(255,244,244,0.9)] p-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#b42318]">
                            Delete profile
                        </div>

                        <div className="mt-1 text-[11px] text-[#7a271a]">
                            Remove this saved profile?
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                                className="rounded-lg border border-[rgba(130,129,111,0.18)] bg-white px-3 py-2 text-[11px] font-medium text-[#656554] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                type="button"
                                onClick={onCancelDelete}
                                disabled={isBusy}
                            >
                                Cancel
                            </button>

                            <button
                                className="rounded-lg bg-[#d92d20] px-3 py-2 text-[11px] font-medium text-white transition hover:bg-[#b42318] disabled:cursor-not-allowed disabled:opacity-60"
                                type="button"
                                onClick={onConfirmDelete}
                                disabled={isBusy}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ProfilePickerModal renders the dashboard saved-profile picker as a fixed overlay dialog.
// LoadedDashboardView uses this so profile switching can reuse the app's current modal pattern without a permanent left rail.
export const ProfilePickerModal = ({
    isOpen,
    saveProfiles,
    activeSaveProfileId,
    openingSaveProfileId,
    isBusy,
    onClose,
    onSelectSaveProfile,
    onDeleteProfile,
    onOpenEntryOptions
}: ProfilePickerModalProps) => {
    // pendingDeleteProfileId tracks which profile row is showing delete confirmation inside the modal.
    // ProfilePickerModal owns this so delete UI state stays local to the picker instead of the full dashboard shell.
    const [pendingDeleteProfileId, setPendingDeleteProfileId] = useState<string | null>(null);

    // handleSelect wraps profile selection so the modal closes before the dashboard starts loading the next profile.
    // ProfilePickerModal uses this so the user immediately gets the center dashboard space back during profile switches.
    const handleSelect = async (saveProfileId: string) => {
        onClose();
        await onSelectSaveProfile(saveProfileId);
    };

    // handleConfirmDelete wraps backend deletion and clears inline delete state after completion.
    // ProfilePickerModal uses this so row-level delete confirmation stays consistent across profiles.
    const handleConfirmDelete = async (saveProfileId: string) => {
        await onDeleteProfile(saveProfileId);
        setPendingDeleteProfileId(null);
    };

    // handleOpenEntryOptions routes the user back to the existing entry screen flows and closes the picker first.
    // ProfilePickerModal uses this so upload and manual creation entry points stay centralized in App.tsx and EntryView.
    const handleOpenEntryOptions = () => {
        onClose();
        onOpenEntryOptions();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.42)] px-4 backdrop-blur-[2px]">
            <div className="w-full max-w-[720px] rounded-3xl border border-gray-200 bg-white p-6 text-[#38392a] shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                            Saved Profiles
                        </p>

                        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                            Open a different tracker
                        </h2>

                        <p className="mt-3 text-[15px] leading-6 text-gray-600">
                            Switch the active dashboard profile or return to the entry screen for upload and manual creation flows.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(130,129,111,0.18)] bg-gray-50 text-sm font-bold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                        aria-label="Close profile picker"
                        onClick={onClose}
                    >
                        X
                    </button>
                </div>

                <div className="mt-6 grid max-h-[60vh] gap-3 overflow-y-auto pr-1">
                    {saveProfiles.length > 0 ? (
                        saveProfiles.map((saveProfile) => {
                            const isActiveProfile = saveProfile.id === activeSaveProfileId;
                            const isOpeningProfile = saveProfile.id === openingSaveProfileId;
                            const isPendingDelete = saveProfile.id === pendingDeleteProfileId;

                            return (
                                <ProfilePickerListItem
                                    key={saveProfile.id}
                                    saveProfile={saveProfile}
                                    isActiveProfile={isActiveProfile}
                                    isOpeningProfile={isOpeningProfile}
                                    isPendingDelete={isPendingDelete}
                                    isBusy={isBusy}
                                    onSelect={() => {
                                        return handleSelect(saveProfile.id);
                                    }}
                                    onRequestDelete={() => {
                                        setPendingDeleteProfileId(saveProfile.id);
                                    }}
                                    onCancelDelete={() => {
                                        setPendingDeleteProfileId(null);
                                    }}
                                    onConfirmDelete={() => {
                                        return handleConfirmDelete(saveProfile.id);
                                    }}
                                />
                            );
                        })
                    ) : (
                        <div className="rounded-2xl border border-[rgba(130,129,111,0.12)] bg-gray-50 px-4 py-5 text-sm text-gray-600">
                            No saved profiles are available for this account yet.
                        </div>
                    )}
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[rgba(130,129,111,0.12)] pt-4">
                    <button
                        type="button"
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-gray-700 transition hover:bg-gray-50"
                        onClick={onClose}
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        className="rounded-xl bg-[#6b7a34] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#5a672b]"
                        onClick={handleOpenEntryOptions}
                    >
                        Entry Options
                    </button>
                </div>
            </div>
        </div>
    );
};
