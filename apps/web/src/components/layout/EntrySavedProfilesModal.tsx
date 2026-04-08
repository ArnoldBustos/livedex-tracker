import type { SaveProfileRecord } from "../../types/save";
import { getDisplayGameLabel } from "../../lib/getDisplayGameLabel";

type EntrySavedProfilesModalProps = {
    isOpen: boolean;
    isUploading: boolean;
    openingSaveProfileId: string | null;
    saveProfiles: SaveProfileRecord[];
    onOpenExistingSave: (saveProfileId: string) => void;
    onClose: () => void;
};

// SavedProfileListItem renders one reusable saved-profile row for the entry-page recent list and modal list.
// EntrySavedProfilesModal uses this so profile rows stay visually aligned with the inline recent list without duplicating markup.
const SavedProfileListItem = ({
    isUploading,
    isOpeningProfile,
    saveProfile,
    onOpenExistingSave,
    onAfterOpen
}: {
    isUploading: boolean;
    isOpeningProfile: boolean;
    saveProfile: SaveProfileRecord;
    onOpenExistingSave: (saveProfileId: string) => void;
    onAfterOpen: () => void;
}) => {
    // handleOpenProfile forwards the selected save id and then closes any surrounding modal context.
    // SavedProfileListItem uses this so both inline and modal profile rows can share one click behavior.
    const handleOpenProfile = () => {
        onOpenExistingSave(saveProfile.id);
        onAfterOpen();
    };

    const gameLabel = getDisplayGameLabel({
        detectedGame: null,
        detectedLayout: undefined,
        saveProfileGame: saveProfile.game,
        unknownLabel: "Unknown Game"
    });

    return (
        <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-left transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleOpenProfile}
            disabled={isUploading}
        >
            <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-900">
                    {saveProfile.name}
                </span>

                <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                    {gameLabel}
                </span>
            </span>

            <span className="shrink-0 text-sm font-semibold text-gray-400">
                {isOpeningProfile ? "Opening..." : "Open"}
            </span>
        </button>
    );
};

// EntrySavedProfilesModal renders the full signed-in saved-profile browser for the entry page.
// EmptyStateView opens this so the entry screen can keep recent profiles compact inline while still exposing the full list on demand.
export const EntrySavedProfilesModal = ({
    isOpen,
    isUploading,
    openingSaveProfileId,
    saveProfiles,
    onOpenExistingSave,
    onClose
}: EntrySavedProfilesModalProps) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.42)] px-4 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[680px] rounded-[28px] bg-white p-5 shadow-xl sm:p-6"
                onClick={(event) => {
                    event.stopPropagation();
                }}
            >
                <button
                    type="button"
                    className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(130,129,111,0.18)] bg-white text-lg font-medium text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                    onClick={onClose}
                >
                    x
                </button>

                <div className="pr-12">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                        Saved Profiles
                    </p>

                    <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                        Open saved profiles
                    </h2>
                </div>

                <div className="mt-5 max-h-[65vh] overflow-y-auto pr-1">
                    <div className="grid gap-3">
                        {saveProfiles.map((saveProfile) => {
                            return (
                                <SavedProfileListItem
                                    key={saveProfile.id}
                                    isUploading={isUploading}
                                    isOpeningProfile={openingSaveProfileId === saveProfile.id}
                                    saveProfile={saveProfile}
                                    onOpenExistingSave={onOpenExistingSave}
                                    onAfterOpen={onClose}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
