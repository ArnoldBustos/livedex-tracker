import { parseGen3Save, type ParsedGen3Save } from "./gen3/parseGen3Save";
import { normalizeGen3SaveBuffer } from "./gen3/normalizeGen3SaveBuffer";
import { parseGen4Save } from "./gen4/parseGen4Save";
import { logParseDebug } from "../../lib/debugLog";

export type ParseSaveResult = ParsedGen3Save;

const GEN3_SAVE_FILE_SIZES = new Set([65536, 131072]);
const GEN4_SAVE_FILE_SIZES = new Set([524288]);

export const parseUploadedSave = async (
    fileBuffer: Buffer
): Promise<ParseSaveResult> => {
    // Normalize first so known padded Gen 3 saves can still pass validation.
    const normalizedFileBuffer = normalizeGen3SaveBuffer(fileBuffer);

    logParseDebug("parseUploadedSave fileBuffer.length", fileBuffer.length);
    logParseDebug("parseUploadedSave normalizedFileBuffer.length", normalizedFileBuffer.length);
    logParseDebug("parseUploadedSave before parseGen3Save");

    if (GEN4_SAVE_FILE_SIZES.has(fileBuffer.length)) {
        logParseDebug("parseUploadedSave before parseGen4Save");
        return parseGen4Save(fileBuffer);
    }

    // Validate the normalized size, not the raw uploaded size.
    if (!GEN3_SAVE_FILE_SIZES.has(normalizedFileBuffer.length)) {
        throw new Error(`Unsupported save size: ${fileBuffer.length}`);
    }

    const parsedSave = parseGen3Save(normalizedFileBuffer);

    logParseDebug("parseUploadedSave after parseGen3Save");
    logParseDebug("parseUploadedSave parsedSave", parsedSave);

    return parsedSave;
};
