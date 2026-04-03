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
        <header className="border-b border-gray-200 bg-[#f3f4f6] px-6 py-4">
            <div className="flex min-h-[72px] items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
                        LiveDex Tracker
                    </h1>

                    <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                            {gameLabel}
                        </span>
                    </div>
                </div>

                <div className="flex shrink-0 items-center">
                    <button
                        className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:enabled:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-55"
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