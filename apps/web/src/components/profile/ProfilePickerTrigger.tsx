type ProfilePickerTriggerProps = {
    activeProfileName: string;
    profileCount: number;
    onOpen: () => void;
};

// ProfilePickerTrigger renders the active-profile action that opens the saved-profile picker.
// DashboardSummary uses this so profile switching moves out of the persistent left rail into the profile header.
export const ProfilePickerTrigger = ({
    activeProfileName,
    profileCount,
    onOpen
}: ProfilePickerTriggerProps) => {
    // profileCountLabel formats the saved-profile count shown in the trigger metadata.
    // ProfilePickerTrigger uses this so the summary header can hint that more profiles are available.
    const profileCountLabel = profileCount === 1 ? "1 profile" : `${profileCount} profiles`;

    return (
        <button
            type="button"
            className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border border-[rgba(130,129,111,0.18)] bg-white px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            aria-label={`Open saved profiles. Active profile: ${activeProfileName}`}
            onClick={onOpen}
        >
            <span className="whitespace-nowrap">Profiles</span>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] whitespace-nowrap text-gray-700">
                {profileCountLabel}
            </span>
        </button>
    );
};
