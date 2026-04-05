import { parseGen3Save, type ParsedGen3Save } from "./gen3/parseGen3Save";
import { normalizeGen3SaveBuffer } from "./gen3/normalizeGen3SaveBuffer";

export type ParseSaveResult = ParsedGen3Save;

const GEN3_SAVE_FILE_SIZES = new Set([65536, 131072]);

export const parseUploadedSave = async (
    fileBuffer: Buffer
): Promise<ParseSaveResult> => {
    // Normalize first so known padded Gen 3 saves can still pass validation.
    const normalizedFileBuffer = normalizeGen3SaveBuffer(fileBuffer);

    console.log("parseUploadedSave fileBuffer.length", fileBuffer.length);
    console.log("parseUploadedSave normalizedFileBuffer.length", normalizedFileBuffer.length);
    console.log("parseUploadedSave before parseGen3Save");

    // Validate the normalized size, not the raw uploaded size.
    if (!GEN3_SAVE_FILE_SIZES.has(normalizedFileBuffer.length)) {
        throw new Error(`Unsupported save size: ${fileBuffer.length}`);
    }

    const parsedSave = parseGen3Save(normalizedFileBuffer);

    console.log("parseUploadedSave after parseGen3Save");
    console.log("parseUploadedSave parsedSave", parsedSave);

    return parsedSave;
};
