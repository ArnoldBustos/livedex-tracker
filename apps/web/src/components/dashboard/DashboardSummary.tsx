import { computeDexProgress } from "../../lib/dex/computeDexProgress";
import { ProfilePickerTrigger } from "../profile/ProfilePickerTrigger";

// DashboardSummaryProps defines the active save identity plus the top-row dex summary metrics.
// LoadedDashboardView builds these values from the loaded save and scoped dex summary and passes them here.
type DashboardSummaryProps = {
    saveProfileName: string;
    trainerName: string;
    gameLabel: string;
    showProfilePickerTrigger: boolean;
    profileCount: number;
    onOpenProfilePicker: () => void;
    onEditSaveProfile: () => void;
    totalCount: number;
    caughtCount: number;
    livingCount: number;
    missingCount: number;
};

// SummaryStatCardProps defines one top-row dex metric card label, value, and optional percent label.
// DashboardSummary maps these props into reusable cards so the dashboard keeps the anchored summary strip structure.
type SummaryStatCardProps = {
    label: string;
    value: number;
    percentLabel?: string;
    accentClassName: string;
};

// SummaryStatCard renders one compact dashboard metric card in the top summary strip.
// DashboardSummary uses this for caught, living, and missing so the non-profile cards stay visually parallel.
const SummaryStatCard = ({
    label,
    value,
    percentLabel,
    accentClassName
}: SummaryStatCardProps) => {
    return (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className={`mb-4 h-1.5 w-12 rounded-full ${accentClassName}`} />

            <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                {label}
            </div>

            <strong className="mt-3 block text-4xl leading-none font-extrabold tracking-tight text-gray-900">
                {value}
            </strong>

            {percentLabel ? (
                <div className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                    {percentLabel}
                </div>
            ) : null}
        </div>
    );
};

// SummaryActionButton renders one compact secondary action for the active profile card.
// DashboardSummary uses this for profile edit so action sizing stays aligned with the profile-picker trigger.
const SummaryActionButton = ({
    label,
    onClick
}: {
    label: string;
    onClick: () => void;
}) => {
    return (
        <button
            type="button"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[rgba(130,129,111,0.18)] bg-gray-50 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            onClick={onClick}
        >
            {label}
        </button>
    );
};

// DashboardSummary renders the restored top summary strip with one profile card plus three dex metric cards.
// LoadedDashboardView places this above the dex workspace so the page keeps its stronger anchored dashboard structure.
export const DashboardSummary = ({
    saveProfileName,
    trainerName,
    gameLabel,
    showProfilePickerTrigger,
    profileCount,
    onOpenProfilePicker,
    onEditSaveProfile,
    totalCount,
    caughtCount,
    livingCount,
    missingCount
}: DashboardSummaryProps) => {
    const dexProgress = computeDexProgress({
        total: totalCount,
        seen: 0,
        caught: caughtCount,
        living: livingCount
    });

    return (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.45fr_repeat(3,minmax(0,1fr))]">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                        Save Profile
                    </div>

                    <strong className="mt-3 block min-w-0 text-2xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-[28px]">
                        {saveProfileName}
                    </strong>

                    <div className="mt-3 text-sm font-semibold text-gray-600">
                        {trainerName}
                    </div>

                    <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-green-700">
                        {gameLabel}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    {showProfilePickerTrigger ? (
                        <ProfilePickerTrigger
                            activeProfileName={saveProfileName}
                            profileCount={profileCount}
                            onOpen={onOpenProfilePicker}
                        />
                    ) : null}

                    <SummaryActionButton
                        label="Edit"
                        onClick={onEditSaveProfile}
                    />
                </div>
            </div>

            <SummaryStatCard
                label="Caught"
                value={caughtCount}
                percentLabel={`${dexProgress.caughtPercent}% complete`}
                accentClassName="bg-sky-400"
            />
            <SummaryStatCard
                label="Living Dex"
                value={livingCount}
                percentLabel={`${dexProgress.livingPercent}% complete`}
                accentClassName="bg-emerald-400"
            />
            <SummaryStatCard
                label="Missing"
                value={missingCount}
                accentClassName="bg-rose-400"
            />
        </section>
    );
};
