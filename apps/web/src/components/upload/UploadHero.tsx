import { useState } from "react";

type UploadHeroProps = {
    isUploading: boolean;
    errorMessage: string;
    onUploadStart: () => void;
    onUploadFile: (file: File, saveProfileName: string) => Promise<void>;
    onUploadError: (errorMessage: string) => void;
};

// getIsSupportedSaveFile validates accepted save file extensions for new uploads
// UploadHero uses this before passing the selected file to the parent upload flow
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

export const UploadHero = ({
    isUploading,
    errorMessage,
    onUploadStart,
    onUploadFile,
    onUploadError
}: UploadHeroProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [saveProfileName, setSaveProfileName] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    // uploadFile validates the chosen file and hands upload execution to the parent
    // App.tsx owns the real network flow so UploadHero stays a pure UI layer
    const uploadFile = async (file: File) => {
        if (!getIsSupportedSaveFile(file)) {
            onUploadError("Only .sav and .srm files are supported.");
            return;
        }

        setSelectedFile(file);
        onUploadStart();

        try {
            await onUploadFile(file, saveProfileName.trim());
        } catch (error) {
            if (error instanceof Error) {
                onUploadError(error.message);
                return;
            }

            onUploadError("Unknown upload error");
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextFiles = event.target.files;

        if (!nextFiles || nextFiles.length === 0) {
            setSelectedFile(null);
            return;
        }

        const nextFile = nextFiles[0];
        await uploadFile(nextFile);

        event.target.value = "";
    };

    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();

        if (isUploading) {
            return;
        }

        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragging(false);

        if (isUploading) {
            return;
        }

        const droppedFiles = event.dataTransfer.files;

        if (!droppedFiles || droppedFiles.length === 0) {
            return;
        }

        const droppedFile = droppedFiles[0];
        await uploadFile(droppedFile);
    };

    return (
        <section className="flex w-full max-w-[1120px] justify-center">
            <div className="grid w-full max-w-[1080px] grid-cols-[280px_minmax(0,1fr)] gap-6">
                <aside className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
                        Guest Mode
                    </div>

                    <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900">
                        LiveDex Tracker
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        Upload a Gen 3 save to preview your Pokédex progress before signing in.
                    </p>

                    <div className="mt-6 rounded-xl bg-gray-50 p-4">
                        <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-500">
                            Signed-in later
                        </div>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Save multiple named profiles to your account and access them across devices.
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
                                Drag in a Pokémon Gen 3 save or choose a file to build a temporary guest profile.
                            </p>
                        </div>

                        <div className="hidden rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-green-800 md:block">
                            Guest
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="save-profile-name"
                            className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-gray-500"
                        >
                            Save profile name
                        </label>
                        <input
                            id="save-profile-name"
                            className="min-h-[48px] rounded-xl border border-gray-200 bg-gray-50 px-4 text-[14px] text-gray-900 outline-none transition focus:border-green-500 focus:bg-white"
                            type="text"
                            placeholder="LeafGreen - Chey playthrough"
                            value={saveProfileName}
                            onChange={(event) => {
                                setSaveProfileName(event.target.value);
                            }}
                            disabled={isUploading}
                        />
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
                            ↑
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
                                Supports .sav and .srm files. Valid files upload automatically.
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
                            : "Guest profiles are temporary until account support is added."}
                    </div>
                </div>
            </div>
        </section>
    );
};