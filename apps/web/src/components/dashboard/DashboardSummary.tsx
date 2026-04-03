type DashboardSummaryProps = {
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
};

const SummaryStatCard = ({
    label,
    value
}: SummaryStatCardProps) => {
    return (
        <div className="flex min-h-[108px] flex-col justify-between rounded-[18px] border border-[rgba(130,129,111,0.12)] bg-[rgba(255,255,255,0.55)] px-4 py-3 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                {label}
            </span>

            <strong className="text-[30px] leading-none font-extrabold tracking-[-0.05em] text-[#38392a]">
                {value}
            </strong>

            <span className="invisible text-[12px] font-bold">
                placeholder
            </span>
        </div>
    );
};

export const DashboardSummary = ({
    trainerName,
    gameLabel,
    caughtCount,
    livingCount,
    missingCount,
    seenOnlyCount
}: DashboardSummaryProps) => {
    return (
        <section
            className="mb-6 grid gap-[14px] rounded-[24px] p-[18px] md:grid-cols-[1.15fr_repeat(4,minmax(0,1fr))]"
            style={{
                backgroundColor: "#f6f5dc",
                backgroundImage:
                    "repeating-linear-gradient(-45deg, rgba(187,186,166,0.14) 0, rgba(187,186,166,0.14) 6px, transparent 6px, transparent 14px)"
            }}
        >
            <div className="flex min-h-[108px] flex-col justify-center rounded-[18px] border border-[rgba(130,129,111,0.12)] bg-[rgba(255,255,255,0.72)] px-5 py-4 text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                    Trainer
                </span>

                <strong className="mt-1 text-[26px] leading-[0.94] font-extrabold tracking-[-0.05em] text-[#38392a]">
                    {trainerName}
                </strong>

                <span className="mt-2 text-[12px] font-bold text-[#935600]">
                    {gameLabel}
                </span>
            </div>

            <SummaryStatCard label="Caught" value={caughtCount} />
            <SummaryStatCard label="Living Dex" value={livingCount} />
            <SummaryStatCard label="Missing" value={missingCount} />
            <SummaryStatCard label="Seen Only" value={seenOnlyCount} />
        </section>
    );
};