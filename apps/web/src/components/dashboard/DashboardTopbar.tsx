type DashboardTopbarProps = {
    gameLabel: string;
    isUploading: boolean;
    isGuestMode: boolean;
    sessionLabel: string;
    onReset: () => void;
    onUpdateSave: (file: File) => void;
    onLogout: () => void;
    onGoToLogin: () => void;
    onGoToRegister: () => void;
};

// getIsSupportedSaveFile validates accepted save file extensions for dashboard updates
// handleFileChange uses this before passing the file to the parent update handler
const getIsSupportedSaveFile = (file: File) => {
    const lowercaseFileName = file.name.toLowerCase();

    if (lowercaseFileName.endsWith(".sav")) {
        return true;
    }

    if (lowercaseFileName.endsWith(".srm")) {
        return true;
    }

    return false;
};

export const DashboardTopbar = ({
    gameLabel,
    isUploading,
    isGuestMode,
    sessionLabel,
    onReset,
    onUpdateSave,
    onLogout,
    onGoToLogin,
    onGoToRegister
}: DashboardTopbarProps) => {
    // handleFileChange reads the chosen file and forwards valid save files upward
    // DashboardTopbar uses this to support replacing the active save profile
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextFiles = event.target.files;

        if (!nextFiles || nextFiles.length === 0) {
            return;
        }

        const nextFile = nextFiles[0];

        if (!getIsSupportedSaveFile(nextFile)) {
            event.target.value = "";
            return;
        }

        onUpdateSave(nextFile);
        event.target.value = "";
    };

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

                <div className="flex shrink-0 items-center gap-3">
                    <div className="hidden min-w-[220px] rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm md:block">
                        <div className="flex items-center gap-2">
                            <span
                                className={
                                    isGuestMode
                                        ? "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700"
                                        : "inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700"
                                }
                            >
                                {isGuestMode ? "Guest Mode" : "Signed In"}
                            </span>
                        </div>

                        <div className="mt-2 text-[13px] font-medium text-gray-700">
                            {sessionLabel}
                        </div>
                    </div>

                    <input
                        id="update-save-file-input"
                        className="pointer-events-none absolute h-px w-px opacity-0"
                        type="file"
                        accept=".sav,.srm"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />

                    <label
                        htmlFor="update-save-file-input"
                        className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                    >
                        {isUploading ? "Loading..." : "Update Save"}
                    </label>

                    <button
                        className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-55"
                        type="button"
                        onClick={onReset}
                        disabled={isUploading}
                    >
                        Upload Another Save
                    </button>

                    {isGuestMode ? (
                        <>
                            <button
                                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-55"
                                type="button"
                                onClick={onGoToLogin}
                                disabled={isUploading}
                            >
                                Sign In
                            </button>

                            <button
                                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-55"
                                type="button"
                                onClick={onGoToRegister}
                                disabled={isUploading}
                            >
                                Create Account
                            </button>
                        </>
                    ) : null}

                    <button
                        className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-55"
                        type="button"
                        onClick={onLogout}
                        disabled={isUploading}
                    >
                        {isGuestMode ? "Exit Guest Mode" : "Log Out"}
                    </button>
                </div>
            </div>
        </header>
    );
};