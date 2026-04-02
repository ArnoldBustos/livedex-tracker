import { parseGen3Save, type ParsedGen3Save } from "./gen3/parseGen3Save";

export type ParseSaveResult = ParsedGen3Save;

const GEN3_SAVE_FILE_SIZES = new Set([65536, 131072]);

export const parseUploadedSave = async (
    fileBuffer: Buffer
): Promise<ParseSaveResult> => {
    console.log("parseUploadedSave fileBuffer.length", fileBuffer.length);
    console.log("parseUploadedSave before parseGen3Save");

    if (!GEN3_SAVE_FILE_SIZES.has(fileBuffer.length)) {
        throw new Error(`Unsupported save size: ${fileBuffer.length}`);
    }

    const parsedSave = parseGen3Save(fileBuffer);

    console.log("parseUploadedSave after parseGen3Save");
    console.log("parseUploadedSave parsedSave", parsedSave);

    return parsedSave;
};