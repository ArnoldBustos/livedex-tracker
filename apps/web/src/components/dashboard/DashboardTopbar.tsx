type DashboardTopbarProps = {
    gameLabel: string;
    isUploading: boolean;
    onReset: () => void;
};

export const DashboardTopbar = ({
    gameLabel,
    isUploading,
    onReset
}: DashboardTopbarProps) => {
    return (
        <header
            className="border-b border-[rgba(130,129,111,0.18)] px-6 py-4"
            style={{
                backgroundColor: "#f6f5dc",
                backgroundImage:
                    "repeating-linear-gradient(-45deg, rgba(187,186,166,0.28) 0, rgba(187,186,166,0.28) 6px, transparent 6px, transparent 14px)"
            }}
        >
            <div className="grid min-h-[84px] grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div />

                <div className="flex min-w-0 flex-col items-center justify-center gap-2 text-center">
                    <h1 className="m-0 text-[40px] leading-[0.95] font-extrabold tracking-[-0.05em] text-[#38392a] md:text-[48px]">
                        LiveDex Tracker
                    </h1>

                    <span className="inline-flex min-h-[36px] items-center rounded-full bg-[rgba(255,152,0,0.12)] px-3 py-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#935600]">
                        {gameLabel}
                    </span>
                </div>

                <div className="flex justify-end">
                    <button
                        className="inline-flex min-h-[48px] items-center justify-center rounded-[16px] bg-[#ff9800] px-[18px] py-3 text-[14px] font-extrabold text-[#4a2800] transition hover:enabled:-translate-y-px hover:enabled:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                        type="button"
                        onClick={onReset}
                        disabled={isUploading}
                    >
                        {isUploading ? "Loading..." : "Upload Another Save"}
                    </button>
                </div>
            </div>
        </header>
    );
};