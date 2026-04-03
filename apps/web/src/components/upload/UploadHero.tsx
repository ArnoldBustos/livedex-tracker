import { useState } from "react";
import type { DexResponse, UploadResponse } from "../../types/save";

type UploadHeroProps = {
    isUploading: boolean;
    errorMessage: string;
    onUploadStart: () => void;
    onUploadSuccess: (
        uploadResponse: UploadResponse,
        dexResponse: DexResponse
    ) => void;
    onUploadError: (errorMessage: string) => void;
};

const API_BASE_URL = "http://localhost:4000";

export const UploadHero = ({
    isUploading,
    errorMessage,
    onUploadStart,
    onUploadSuccess,
    onUploadError
}: UploadHeroProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [saveProfileName, setSaveProfileName] = useState("");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextFiles = event.target.files;

        if (!nextFiles || nextFiles.length === 0) {
            setSelectedFile(null);
            return;
        }

        setSelectedFile(nextFiles[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            onUploadError("Choose a .sav or .srm file first.");
            return;
        }

        onUploadStart();

        try {
            const formData = new FormData();
            formData.append("saveFile", selectedFile);

            if (saveProfileName.trim()) {
                formData.append("saveProfileName", saveProfileName.trim());
            }

            const uploadRequest = await fetch(`${API_BASE_URL}/uploads`, {
                method: "POST",
                body: formData
            });

            const uploadResponseText = await uploadRequest.text();

            if (!uploadRequest.ok) {
                throw new Error(uploadResponseText || "Upload failed");
            }

            const parsedUploadResponse = JSON.parse(uploadResponseText) as UploadResponse;
            const saveProfileId = parsedUploadResponse.saveProfile.id;

            const dexRequest = await fetch(`${API_BASE_URL}/dex/profile/${saveProfileId}`);

            if (!dexRequest.ok) {
                throw new Error("Dex fetch failed after upload");
            }

            const parsedDexResponse = await dexRequest.json() as DexResponse;

            onUploadSuccess(parsedUploadResponse, parsedDexResponse);
        } catch (error) {
            if (error instanceof Error) {
                onUploadError(error.message);
                return;
            }

            onUploadError("Unknown upload error");
        }
    };

    return (
        <section className="relative z-10 flex w-full max-w-[760px] justify-center">
            <div className="flex w-full max-w-[680px] flex-col gap-6 rounded-[28px] border border-[rgba(130,129,111,0.18)] bg-[#f6f5dc] p-8 shadow-[0_16px_40px_rgba(56,57,42,0.08)]">
                <div className="flex flex-col gap-2.5">
                    <p className="m-0 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#935600]">
                        Gen 3 Save Parser
                    </p>
                    <h1 className="m-0 text-[clamp(34px,6vw,56px)] leading-[0.95] font-extrabold tracking-[-0.04em] text-[#38392a]">
                        LiveDex Tracker
                    </h1>
                    <p className="m-0 max-w-[560px] text-[16px] leading-[1.6] text-[#656554]">
                        Upload a Pokémon Gen 3 save file to view trainer info, Pokédex progress,
                        and your current living dex state.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="save-profile-name"
                        className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#82816f]"
                    >
                        Save profile name
                    </label>
                    <input
                        id="save-profile-name"
                        className="min-h-[48px] rounded-[16px] border border-[rgba(130,129,111,0.18)] bg-[rgba(255,255,255,0.7)] px-4 text-[14px] text-[#38392a] outline-none transition focus:border-[rgba(147,86,0,0.38)]"
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
                />

                <label
                    htmlFor="save-file-input"
                    className="flex cursor-pointer items-center gap-[18px] rounded-[22px] border-2 border-dashed border-[rgba(130,129,111,0.28)] bg-[rgba(255,255,255,0.48)] px-6 py-7 transition duration-150 hover:-translate-y-px hover:border-[rgba(147,86,0,0.38)] hover:bg-[rgba(255,255,255,0.72)] max-[640px]:flex-col max-[640px]:items-start max-[640px]:px-[18px] max-[640px]:py-[22px]"
                >
                    <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] border border-[rgba(147,86,0,0.14)] bg-[rgba(255,152,0,0.14)] text-[24px] font-extrabold text-[#935600]">
                        ↑
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="text-[17px] font-extrabold text-[#38392a]">
                            {selectedFile ? "Replace selected save file" : "Choose a save file"}
                        </div>
                        <div className="text-[14px] text-[#656554]">
                            Supports .sav and .srm files
                        </div>
                    </div>
                </label>

                <div className="flex flex-col gap-1.5 rounded-[18px] border border-[rgba(130,129,111,0.12)] bg-[#ebeace] px-[18px] py-4">
                    <span className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#82816f]">
                        Selected file
                    </span>
                    <span className="break-words text-[14px] text-[#38392a]">
                        {selectedFile ? selectedFile.name : "No file selected"}
                    </span>
                </div>

                {errorMessage ? (
                    <div className="rounded-[14px] border border-[rgba(190,45,6,0.2)] bg-[rgba(249,86,48,0.16)] px-4 py-[14px] text-[#7a0003]">
                        {errorMessage}
                    </div>
                ) : null}

                <div className="flex justify-start max-[640px]:w-full">
                    <button
                        className="inline-flex min-h-[48px] min-w-[180px] items-center justify-center rounded-[16px] bg-[#ff9800] px-[18px] py-3 text-[14px] font-extrabold text-[#4a2800] transition duration-120 hover:enabled:-translate-y-px hover:enabled:opacity-95 disabled:cursor-not-allowed disabled:opacity-55 max-[640px]:w-full"
                        type="button"
                        onClick={handleUpload}
                        disabled={isUploading}
                    >
                        {isUploading ? "Uploading..." : "Upload Save"}
                    </button>
                </div>
            </div>
        </section>
    );
};