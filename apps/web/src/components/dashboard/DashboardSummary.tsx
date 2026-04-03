type DashboardSummaryProps = {
    saveProfileName: string;
    trainerName: string;
    gameLabel: string;
    caughtCount: number;
    livingCount: number;
    missingCount: number;
    seenOnlyCount: number;
};

type SummaryStatCardProps = {
    label: string;
    value: number;
    accentClassName: string;
};

const SummaryStatCard = ({
    label,
    value,
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
        </div>
    );
};

export const DashboardSummary = ({
    saveProfileName,
    trainerName,
    gameLabel,
    caughtCount,
    livingCount,
    missingCount,
    seenOnlyCount
}: DashboardSummaryProps) => {
    return (
        <section className="grid gap-4 md:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))]">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                    Save Profile
                </div>

                <strong className="mt-3 block truncate text-3xl leading-tight font-extrabold tracking-tight text-gray-900">
                    {saveProfileName}
                </strong>

                <div className="mt-3 text-sm font-semibold text-gray-600">
                    {trainerName}
                </div>

                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-green-700">
                    {gameLabel}
                </div>
            </div>

            <SummaryStatCard
                label="Caught"
                value={caughtCount}
                accentClassName="bg-sky-400"
            />
            <SummaryStatCard
                label="Living Dex"
                value={livingCount}
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