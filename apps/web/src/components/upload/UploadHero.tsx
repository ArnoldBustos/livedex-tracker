import { useState } from "react";

type UploadHeroProps = {
    isUploading: boolean;
    errorMessage: string;
    onSelectUploadFile: (file: File) => void;
    onUploadError: (errorMessage: string) => void;
};

// getIsSupportedSaveFile validates accepted save file extensions for new uploads.
// UploadHero uses this before handing the file to App.tsx for save setup orchestration.
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

// UploadHero renders the empty-state upload picker and status copy.
// EmptyStateView uses this so file selection stays separate from manual-entry setup UI.
export const UploadHero = ({
    isUploading,
    errorMessage,
    onSelectUploadFile,
    onUploadError
}: UploadHeroProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // handleSelectedFile validates the chosen file and forwards it into the shared save setup flow.
    // App.tsx receives the file so upload details can be collected outside this presentational component.
    const handleSelectedFile = (file: File) => {
        if (!getIsSupportedSaveFile(file)) {
            onUploadError("Only .sav and .srm files are supported.");
            return;
        }

        setSelectedFile(file);
        onSelectUploadFile(file);
    };

    // handleFileChange reads the hidden file input and forwards the chosen file upward.
    // UploadHero uses this for click-based file picking.
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextFiles = event.target.files;

        if (!nextFiles || nextFiles.length === 0) {
            setSelectedFile(null);
            return;
        }

        handleSelectedFile(nextFiles[0]);
        event.target.value = "";
    };

    // handleDragOver enables dropzone styling while a file is dragged over the upload target.
    // UploadHero uses this to keep drag feedback local to the upload surface.
    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();

        if (isUploading) {
            return;
        }

        setIsDragging(true);
    };

    // handleDragLeave clears the temporary dropzone highlight when the drag leaves the target.
    // UploadHero uses this so the drag state resets cleanly.
    const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragging(false);
    };

    // handleDrop validates and forwards a dropped save file into shared setup state.
    // App.tsx owns the next step so UploadHero remains limited to selection UX.
    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragging(false);

        if (isUploading) {
            return;
        }

        const droppedFiles = event.dataTransfer.files;

        if (!droppedFiles || droppedFiles.length === 0) {
            return;
        }

        handleSelectedFile(droppedFiles[0]);
    };

    return (
        <section className="flex w-full justify-center">
            <div className="grid w-full max-w-[1080px] grid-cols-[280px_minmax(0,1fr)] gap-6">
                <aside className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
                        Save Upload
                    </div>

                    <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900">
                        LiveDex Tracker
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        Upload a Gen 3 save to build a tracker session from real save data.
                    </p>

                    <div className="mt-6 rounded-xl bg-gray-50 p-4">
                        <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-500">
                            Shared setup
                        </div>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            File selection now opens the shared save setup form so upload and manual entry use one naming path.
                        </p>
                    </div>
                </aside>

                <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                                Upload Save
                            </p>

                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                                Start with a save file
                            </h1>

                            <p className="mt-2 max-w-[560px] text-[15px] leading-6 text-gray-600">
                                Drag in a Pokemon Gen 3 save or choose a file to open save setup before the upload starts.
                            </p>
                        </div>

                        <div className="hidden rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-green-800 md:block">
                            Upload
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#d7d3ae] bg-[#f8f6e8] px-4 py-3 text-[14px] leading-6 text-[#56573f]">
                        Upload setup collects the save name in the shared save details dialog. Game detection still comes from the uploaded file.
                    </div>

                    <input
                        id="save-file-input"
                        className="pointer-events-none absolute h-px w-px opacity-0"
                        type="file"
                        accept=".sav,.srm"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />

                    <label
                        htmlFor="save-file-input"
                        className={
                            isDragging
                                ? "flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-green-500 bg-green-50 px-6 py-8 transition max-[640px]:flex-col max-[640px]:items-start"
                                : "flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 transition hover:border-green-400 hover:bg-white max-[640px]:flex-col max-[640px]:items-start"
                        }
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[24px] font-extrabold text-green-700 shadow-sm">
                            ^
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="text-[18px] font-extrabold text-gray-900">
                                {isDragging
                                    ? "Drop your save file here"
                                    : selectedFile
                                        ? "Replace selected save file"
                                        : "Choose or drag a save file"}
                            </div>
                            <div className="text-[14px] text-gray-600">
                                Supports .sav and .srm files. File selection opens save setup instead of uploading immediately.
                            </div>
                        </div>
                    </label>

                    <div className="flex flex-col gap-1.5 rounded-xl bg-gray-50 px-4 py-4">
                        <span className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-gray-500">
                            Selected file
                        </span>
                        <span className="break-words text-[14px] text-gray-900">
                            {selectedFile ? selectedFile.name : "No file selected"}
                        </span>
                    </div>

                    {errorMessage ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errorMessage}
                        </div>
                    ) : null}

                    <div className="text-[13px] text-gray-500">
                        {isUploading
                            ? "Uploading save file..."
                            : "Upload details are confirmed in the shared save setup dialog."}
                    </div>
                </div>
            </div>
        </section>
    );
};
