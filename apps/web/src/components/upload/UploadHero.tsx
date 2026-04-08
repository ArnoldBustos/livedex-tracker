import { useState } from "react";

type UploadHeroProps = {
    isUploading: boolean;
    showsReplacementCopy: boolean;
    errorMessage: string;
    onSelectUploadFile: (file: File) => void;
    onUploadError: (errorMessage: string) => void;
};

// UploadHeroProps defines the shared upload-card inputs used on entry and future replacement surfaces.
// UploadHero consumes this so file selection behavior stays reusable while parent routes own upload state.

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

// UploadHero renders upload picker copy for either a neutral entry flow or an active-save replacement flow.
// EmptyStateView and any future replacement surfaces use this so upload wording is controlled by props instead of route-specific checks.
export const UploadHero = ({
    isUploading,
    showsReplacementCopy,
    errorMessage,
    onSelectUploadFile,
    onUploadError
}: UploadHeroProps) => {
    // selectedFile stores the most recently chosen save filename for the current upload card instance.
    // UploadHero uses this so the dropzone and selected-file summary stay in sync after local selection.
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    // isDragging tracks whether a file is hovering over the dropzone for temporary visual feedback.
    // UploadHero uses this so drag styling stays local to the upload surface rather than parent state.
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
        <section className="w-full">
            <div className="flex flex-col gap-5 rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                            Upload Save
                        </p>

                        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-[36px]">
                            Start with a save file.
                        </h2>

                        <p className="mt-2 max-w-[560px] text-[15px] leading-7 text-gray-600">
                            Import a Gen 3 save file (.sav, .srm).
                        </p>
                    </div>
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
                            ? "flex cursor-pointer items-center gap-4 rounded-[24px] border-2 border-dashed border-emerald-700 bg-emerald-50 px-6 py-8 transition max-[640px]:flex-col max-[640px]:items-start"
                            : "flex cursor-pointer items-center gap-4 rounded-[24px] border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 transition hover:border-emerald-700 hover:bg-white max-[640px]:flex-col max-[640px]:items-start"
                    }
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[24px] font-extrabold text-emerald-700 shadow-sm">
                        ^
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="text-[18px] font-extrabold text-gray-900">
                            {isDragging
                                ? "Drop your save file here"
                                : selectedFile
                                    ? showsReplacementCopy
                                        ? "Replace selected save file"
                                        : "Choose or drag a save file"
                                    : "Choose or drag a save file"}
                        </div>
                        <div className="text-[14px] text-gray-600">
                            Choose or drag a save file.
                        </div>
                    </div>
                </label>

                <div
                    className={
                        selectedFile
                            ? "flex flex-col gap-1.5 rounded-2xl bg-gray-50 px-4 py-4"
                            : "flex flex-col gap-1 rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-3"
                    }
                >
                    <span className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-gray-500">
                        Selected File
                    </span>
                    <span
                        className={
                            selectedFile
                                ? "break-words text-[14px] text-gray-900"
                                : "break-words text-[14px] text-gray-500"
                        }
                    >
                        {selectedFile ? selectedFile.name : "No file selected"}
                    </span>
                </div>

                {errorMessage ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                {isUploading ? (
                    <div className="text-[13px] text-gray-500">
                        Uploading save file...
                    </div>
                ) : null}
            </div>
        </section>
    );
};
