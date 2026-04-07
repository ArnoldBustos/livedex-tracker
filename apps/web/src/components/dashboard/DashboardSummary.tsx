import { computeDexProgress } from "../../lib/dex/computeDexProgress";
import type { DexCollectionLayerKey } from "../../types/save";

// DashboardSummaryProps defines the active-layer summary counts plus identity details shown in the dashboard header.
// LoadedDashboardView builds these values from the active dex scope and selected collection layer and passes them here.
type DashboardSummaryProps = {
    saveProfileName: string;
    trainerName: string;
    gameLabel: string;
    activeCollectionLayer: DexCollectionLayerKey;
    onEditSaveProfile: () => void;
    totalCount: number;
    seenCount: number;
    caughtCount: number;
    livingCount: number;
    missingCount: number;
    seenOnlyCount: number;
};

// SummaryStatCardProps defines one summary card label, value, and percentage accent styling.
// DashboardSummary maps these props into reusable metric cards so the header layout stays modular.
type SummaryStatCardProps = {
    label: string;
    value: number;
    percentLabel?: string;
    accentClassName: string;
};

// SummarySecondaryStatProps defines a lighter inline metric used to keep secondary counts visible without full-card emphasis.
// DashboardSummary uses this for support metrics that should stay present but no longer dominate the top row.
type SummarySecondaryStatProps = {
    label: string;
    value: number;
    accentClassName: string;
};

// SummaryStatCard renders one dashboard metric card for a scoped dex count and optional percentage.
// DashboardSummary uses this shared card so each summary metric stays visually consistent.
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

// SummarySecondaryStat renders one compact summary pill with an accent bar and supporting count.
// DashboardSummary places this beside the profile card details to keep secondary metrics visible with less chrome.
const SummarySecondaryStat = ({
    label,
    value,
    accentClassName
}: SummarySecondaryStatProps) => {
    return (
        <div className="rounded-xl border border-[rgba(130,129,111,0.14)] bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
                <div className={`h-1.5 w-8 rounded-full ${accentClassName}`} />
                <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                    {label}
                </div>
            </div>

            <strong className="mt-2 block text-2xl leading-none font-extrabold tracking-tight text-gray-900">
                {value}
            </strong>
        </div>
    );
};

// DashboardSummary renders the active profile details and scoped dex summary metrics.
// LoadedDashboardView places this above the grid so long save names can wrap before the compact stat grid activates.
export const DashboardSummary = ({
    saveProfileName,
    trainerName,
    gameLabel,
    activeCollectionLayer,
    onEditSaveProfile,
    totalCount,
    seenCount,
    caughtCount,
    livingCount,
    missingCount,
    seenOnlyCount
}: DashboardSummaryProps) => {
    const dexProgress = computeDexProgress({
        total: totalCount,
        seen: seenCount,
        caught: caughtCount,
        living: livingCount
    });
    // collectionLayerLabel formats the active collection layer name for the small progress labels in the identity card.
    // DashboardSummary uses this so the copy stays aligned with the active dashboard layer totals.
    const collectionLayerLabel = activeCollectionLayer === "shiny" ? "Shiny" : "Standard";

    return (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.45fr_repeat(3,minmax(0,1fr))]">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                            Save Profile
                        </div>

                        <strong className="mt-3 block min-w-0 break-words text-2xl leading-tight font-extrabold tracking-tight text-gray-900 line-clamp-2">
                            {saveProfileName}
                        </strong>

                        <div className="mt-3 text-sm font-semibold text-gray-600">
                            {trainerName}
                        </div>

                        <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-green-700">
                            {gameLabel}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[rgba(130,129,111,0.18)] bg-gray-50 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                        aria-label="Edit save profile"
                        onClick={onEditSaveProfile}
                    >
                        Edit
                    </button>
                </div>

                <div className="mt-4 grid gap-3 border-t border-[rgba(130,129,111,0.12)] pt-4">
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                        <span>{collectionLayerLabel} Seen {dexProgress.seenPercent}%</span>
                        <span>{collectionLayerLabel} Caught {dexProgress.caughtPercent}%</span>
                        <span>{collectionLayerLabel} Living {dexProgress.livingPercent}%</span>
                    </div>

                    <SummarySecondaryStat
                        label="Seen Only"
                        value={seenOnlyCount}
                        accentClassName="bg-amber-400"
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
