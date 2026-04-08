type EntryTopbarProps = {
    isUploading: boolean;
    isGuestMode: boolean;
    isSignedIn: boolean;
    currentUserEmail: string;
    onGoToLogin: () => void;
    onGoToRegister: () => void;
    onLogout: () => void;
};

// EntryTopbar renders the compact shared app header used above the entry page.
// EntryView uses this so auth actions stay in the unified shell while session-state messaging lives in one top layer.
export const EntryTopbar = ({
    isUploading,
    isGuestMode,
    isSignedIn,
    currentUserEmail,
    onGoToLogin,
    onGoToRegister,
    onLogout
}: EntryTopbarProps) => {
    // getSessionBadgeLabel returns the compact header badge label for the current entry session state.
    // EntryTopbar uses this so guest, local, and signed-in states share one header structure.
    const getSessionBadgeLabel = () => {
        if (isSignedIn) {
            return "Signed In";
        }

        if (isGuestMode) {
            return "Guest Mode";
        }

        return "Local Session";
    };

    // getSessionHelperText returns the short session helper copy shown in the header text area.
    // EntryTopbar uses this so entry persistence messaging does not require a separate ribbon row.
    const getSessionHelperText = () => {
        if (isSignedIn) {
            return "Saved profiles are available from this entry screen.";
        }

        return "Progress is saved locally until you sign in.";
    };

    // getSessionBadgeClassName returns the state badge styling used beside the header helper copy.
    // EntryTopbar uses this so the session indicator stays lightweight while still readable.
    const getSessionBadgeClassName = () => {
        if (isSignedIn) {
            return "inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700";
        }

        if (isGuestMode) {
            return "inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700";
        }

        return "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700";
    };

    return (
        <header className="border-b border-emerald-100 bg-[#eef6ef] px-4 py-3 sm:px-6 sm:py-4">
            <div className="mx-auto flex w-full max-w-[1180px] items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col">
                    <p className="text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">
                        LiveDex Tracker
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={getSessionBadgeClassName()}>
                            {getSessionBadgeLabel()}
                        </span>

                        <p className="text-[13px] font-medium text-emerald-950/72">
                            {getSessionHelperText()}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
                    {isSignedIn ? (
                        <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
                                Account
                            </div>

                            <div className="mt-2 text-[13px] font-medium text-gray-700">
                                {currentUserEmail}
                            </div>
                        </div>
                    ) : null}

                    {!isSignedIn ? (
                        <button
                            className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-55"
                            type="button"
                            onClick={onGoToLogin}
                            disabled={isUploading}
                        >
                            Sign In
                        </button>
                    ) : null}

                    {!isSignedIn ? (
                        <button
                            className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-55"
                            type="button"
                            onClick={onGoToRegister}
                            disabled={isUploading}
                        >
                            Create Account
                        </button>
                    ) : null}

                    {isSignedIn ? (
                        <button
                            className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-55"
                            type="button"
                            onClick={onLogout}
                            disabled={isUploading}
                        >
                            Log Out
                        </button>
                    ) : null}
                </div>
            </div>
        </header>
    );
};
