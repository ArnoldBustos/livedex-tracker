import { parseGen3Save, type ParsedGen3Save } from "./gen3/parseGen3Save";
import { normalizeGen3SaveBuffer } from "./gen3/normalizeGen3SaveBuffer";
import { logParseDebug } from "../../lib/debugLog";

export type ParseSaveResult = ParsedGen3Save;

const GEN3_SAVE_FILE_SIZES = new Set([65536, 131072]);

export const parseUploadedSave = async (
    fileBuffer: Buffer
): Promise<ParseSaveResult> => {
    // Normalize first so known padded Gen 3 saves can still pass validation.
    const normalizedFileBuffer = normalizeGen3SaveBuffer(fileBuffer);

    logParseDebug("parseUploadedSave fileBuffer.length", fileBuffer.length);
    logParseDebug("parseUploadedSave normalizedFileBuffer.length", normalizedFileBuffer.length);
    logParseDebug("parseUploadedSave before parseGen3Save");

    // Validate the normalized size, not the raw uploaded size.
    if (!GEN3_SAVE_FILE_SIZES.has(normalizedFileBuffer.length)) {
        throw new Error(`Unsupported save size: ${fileBuffer.length}`);
    }

    const parsedSave = parseGen3Save(normalizedFileBuffer);

    logParseDebug("parseUploadedSave after parseGen3Save");
    logParseDebug("parseUploadedSave parsedSave", parsedSave);

    return parsedSave;
};
