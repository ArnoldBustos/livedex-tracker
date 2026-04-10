import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

type UploadHeroProps = {
    isUploading: boolean;
    showsReplacementCopy: boolean;
    errorMessage: string;
    onSelectUploadFile: (file: File) => void;
    onUploadError: (errorMessage: string) => void;
};

// UploadHeroProps defines the shared upload-card inputs used on entry and future replacement surfaces.
// UploadHero consumes this so file selection behavior stays reusable while parent routes own upload state.

// magneticDropZoneInset expands the invisible drag-capture area around the visible drop surface.
// UploadHero uses this so the dropzone feels easier to catch before the cursor reaches the border.
const magneticDropZoneInsetClassName = "-m-4 p-4 sm:-m-5 sm:p-5";

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

// UploadCloudIcon renders the upload glyph used by the dropzone instead of the temporary caret.
// UploadHero uses this so the upload affordance matches the drag-and-drop treatment more clearly.
const UploadCloudIcon = () => {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7 18.5H6.5C4.01 18.5 2 16.49 2 14C2 11.74 3.67 9.87 5.85 9.56C6.61 6.92 9.04 5 11.9 5C15.06 5 17.69 7.34 18.14 10.38C20.36 10.58 22 12.44 22 14.7C22 17.07 20.07 19 17.7 19H17" />
            <path d="M12 20V11" />
            <path d="M8.75 14.25L12 11L15.25 14.25" />
        </svg>
    );
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
    // isDragging tracks whether a dragged file is inside the expanded upload capture zone.
    // UploadHero uses this so the visible drop surface can react before the cursor reaches its border.
    const [isDragging, setIsDragging] = useState(false);
    // dragDepthRef counts nested drag targets inside the expanded capture zone.
    // UploadHero uses this so dragleave events from child nodes do not turn off the active state too early.
    const dragDepthRef = useRef(0);

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
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextFiles = event.target.files;

        if (!nextFiles || nextFiles.length === 0) {
            setSelectedFile(null);
            return;
        }

        handleSelectedFile(nextFiles[0]);
        event.target.value = "";
    };

    // resetDragState clears the expanded dropzone highlight after a drag finishes or exits.
    // UploadHero uses this so drag visuals and nested drag counters return to their idle state together.
    const resetDragState = () => {
        dragDepthRef.current = 0;
        setIsDragging(false);
    };

    // handleDragEnter activates the expanded magnetic dropzone as soon as a dragged file enters its capture area.
    // UploadHero uses this so users get active feedback before they are fully inside the visible dashed border.
    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (isUploading) {
            return;
        }

        dragDepthRef.current += 1;
        setIsDragging(true);
    };

    // handleDragOver keeps the browser drop interaction enabled while a file hovers over the capture area.
    // UploadHero uses this so the drag can continue smoothly across the enlarged magnetic boundary.
    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (isUploading) {
            return;
        }

        if (!isDragging) {
            setIsDragging(true);
        }
    };

    // handleDragLeave clears the active drag state only after the pointer leaves the full expanded capture area.
    // UploadHero uses this so moving across child elements does not make the dropzone flicker off.
    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (isUploading) {
            return;
        }

        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

        if (dragDepthRef.current === 0) {
            setIsDragging(false);
        }
    };

    // handleDrop validates and forwards a dropped save file into shared setup state.
    // App.tsx owns the next step so UploadHero remains limited to selection UX.
    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        resetDragState();

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
        <section className="flex h-full w-full">
            <div className="flex h-full w-full flex-1 flex-col gap-3 rounded-[28px] bg-white p-4 shadow-sm sm:gap-4 sm:p-5 lg:gap-3 lg:p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                            Upload Save
                        </p>

                        <h2 className="text-[42px] font-extrabold tracking-tight text-gray-900 lg:text-[34px]">
                            Start with a save file.
                        </h2>
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

                <div
                    className={`relative flex-1 rounded-[32px] ${magneticDropZoneInsetClassName}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div
                        className={
                            isDragging
                                ? "pointer-events-none absolute inset-0 rounded-[32px] border-2 border-dashed border-emerald-300/80 bg-emerald-100/35"
                                : "pointer-events-none absolute inset-0 opacity-0"
                        }
                        aria-hidden="true"
                    />

                    <label
                        htmlFor="save-file-input"
                        className={
                            isDragging
                                ? "relative flex h-full min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-emerald-500 bg-emerald-50 px-6 py-6 text-center transition sm:min-h-[300px] sm:px-7 sm:py-7 lg:min-h-[250px] lg:px-7 lg:py-6"
                                : "relative flex h-full min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-6 text-center transition hover:border-emerald-500 hover:bg-white sm:min-h-[300px] sm:px-7 sm:py-7 lg:min-h-[250px] lg:px-7 lg:py-6"
                        }
                    >
                        <div
                            className={
                                isDragging
                                    ? "flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm lg:h-11 lg:w-11"
                                    : "flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm ring-1 ring-gray-200 lg:h-11 lg:w-11"
                            }
                        >
                            <UploadCloudIcon />
                        </div>

                        <div className="mt-3 flex max-w-[520px] flex-col items-center gap-1">
                            <div className="text-[18px] font-extrabold tracking-tight text-gray-900 lg:text-[16px]">
                                {isDragging
                                    ? "Drop your save file here"
                                    : selectedFile
                                        ? showsReplacementCopy
                                            ? "Replace selected save file"
                                            : "Choose or drag a save file"
                                        : "Choose or drag a save file"}
                            </div>
                        </div>

                        <span
                            className={
                                isDragging
                                    ? "mt-4 inline-flex min-h-[42px] items-center justify-center rounded-full border border-emerald-500 bg-white px-5 py-2 text-sm font-semibold text-emerald-800 shadow-sm lg:min-h-[40px] lg:px-4"
                                    : "mt-4 inline-flex min-h-[42px] items-center justify-center rounded-full border border-emerald-300 bg-white px-5 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50 lg:min-h-[40px] lg:px-4"
                            }
                        >
                            Browse Files
                        </span>

                        <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                            Supported: .sav and .srm
                        </span>
                    </label>
                </div>

                <div
                    className={
                        selectedFile
                            ? "flex flex-col gap-1 rounded-2xl bg-gray-50 px-4 py-3"
                            : "flex flex-col gap-1 rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-2.5"
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
