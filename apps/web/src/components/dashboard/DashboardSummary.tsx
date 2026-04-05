import { computeDexProgress } from "../../lib/dex/computeDexProgress";

// DashboardSummaryProps defines the scoped summary counts and identity details shown in the dashboard header.
// LoadedDashboardView builds these values from the active dex scope and passes them into this summary component.
type DashboardSummaryProps = {
    saveProfileName: string;
    trainerName: string;
    gameLabel: string;
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

// DashboardSummary renders the active profile details and scoped dex summary metrics.
// LoadedDashboardView places this above the grid so long save names can wrap before the compact stat grid activates.
export const DashboardSummary = ({
    saveProfileName,
    trainerName,
    gameLabel,
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

    return (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))]">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                    Save Profile
                </div>

                <strong className="mt-3 block text-2xl leading-tight font-extrabold tracking-tight text-gray-900 break-words line-clamp-2">
                    {saveProfileName}
                </strong>

                <div className="mt-3 text-sm font-semibold text-gray-600">
                    {trainerName}
                </div>

                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-green-700">
                    {gameLabel}
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                    <span>Seen {dexProgress.seenPercent}%</span>
                    <span>Caught {dexProgress.caughtPercent}%</span>
                    <span>Living {dexProgress.livingPercent}%</span>
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
            <SummaryStatCard
                label="Seen Only"
                value={seenOnlyCount}
                accentClassName="bg-amber-400"
            />
        </section>
    );
};
