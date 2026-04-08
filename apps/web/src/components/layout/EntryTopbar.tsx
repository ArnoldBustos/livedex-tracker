type EntryTopbarProps = {
    selectedFileName: string | null;
    isUploading: boolean;
    isGuestMode: boolean;
    isSignedIn: boolean;
    sessionLabel: string;
    onSelectUploadFile: (file: File) => void;
    onGoToLogin: () => void;
    onGoToRegister: () => void;
};

// getIsSupportedSaveFile validates accepted save file extensions for entry-page upload actions.
// EntryTopbar uses this before forwarding the selected file into the shared upload setup flow.
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

// EntryTopbar renders the dashboard-matched header shell used above the first entry page.
// EntryView uses this so the upload screen shares the dashboard's header rhythm without inheriting loaded-save behavior.
export const EntryTopbar = ({
    selectedFileName,
    isUploading,
    isGuestMode,
    isSignedIn,
    sessionLabel,
    onSelectUploadFile,
    onGoToLogin,
    onGoToRegister
}: EntryTopbarProps) => {
    // handleFileChange reads the upload button input and forwards supported save files upward.
    // EntryView passes the shared upload handler so topbar uploads and upload-panel uploads stay in the same setup path.
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

        onSelectUploadFile(nextFile);
        event.target.value = "";
    };

    return (
        <div className="overflow-hidden rounded-[28px] border border-[rgba(130,129,111,0.18)] bg-white shadow-sm">
            <header className="px-6 py-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
                            LiveDex Tracker
                        </h1>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {isGuestMode ? (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">
                                    Guest Mode
                                </span>
                            ) : null}

                            {isSignedIn && !isGuestMode ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                                    Signed In
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {isGuestMode || isSignedIn ? (
                            <div className="min-w-[220px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
                                    Session
                                </div>

                                <div className="mt-2 text-[13px] font-medium text-gray-700">
                                    {sessionLabel}
                                </div>
                            </div>
                        ) : null}

                        <div className="min-w-[220px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
                                File Status
                            </div>

                            <div className="mt-2 truncate text-[13px] font-medium text-gray-700">
                                {selectedFileName ? selectedFileName : "No file chosen"}
                            </div>
                        </div>

                        <input
                            id="entry-topbar-upload-input"
                            className="pointer-events-none absolute h-px w-px opacity-0"
                            type="file"
                            accept=".sav,.srm"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />

                        <label
                            htmlFor="entry-topbar-upload-input"
                            className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
                        >
                            {isUploading ? "Loading..." : "Upload Save"}
                        </label>

                        {!isSignedIn ? (
                            <button
                                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-55"
                                type="button"
                                onClick={onGoToLogin}
                                disabled={isUploading}
                            >
                                Sign In
                            </button>
                        ) : null}

                        {!isSignedIn ? (
                            <button
                                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-55"
                                type="button"
                                onClick={onGoToRegister}
                                disabled={isUploading}
                            >
                                Create Account
                            </button>
                        ) : null}
                    </div>
                </div>
            </header>

            <div className="border-t border-gray-200 bg-[#f8fafc] px-6 py-3">
                <div className="flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                        Entry Workspace
                    </div>

                    <div className="text-[13px] font-medium text-gray-600">
                        Upload a save or start a blank tracker without leaving this screen.
                    </div>
                </div>
            </div>
        </div>
    );
};
