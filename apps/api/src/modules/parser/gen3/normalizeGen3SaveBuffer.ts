// STANDARD_SINGLE_SLOT_SIZE_BYTES identifies one physical Gen 3 save slot for early size normalization checks.
const STANDARD_SINGLE_SLOT_SIZE_BYTES = 65536;
// STANDARD_DOUBLE_SLOT_SIZE_BYTES identifies the normal full Gen 3 save size used by parser validation.
const STANDARD_DOUBLE_SLOT_SIZE_BYTES = 131072;
// EMULATOR_PADDED_DOUBLE_SLOT_SIZE_BYTES identifies a known emulator variant with trailing padding bytes.
const EMULATOR_PADDED_DOUBLE_SLOT_SIZE_BYTES = 131088;

/**
 * normalizeGen3SaveBuffer standardizes raw Gen 3 save buffers before section parsing.
 *
 * Connected to:
 * - parseUploadedSave, which uses this to accept common emulator save variants
 * - parseGen3Save, which uses the normalized buffer for section extraction
 *
 * Behavior:
 * - 65536-byte saves are returned as-is for now
 * - 131072-byte saves are returned as-is
 * - 131088-byte saves are trimmed to 131072
 * - other sizes are left alone so the caller can decide whether to reject them
 */
export const normalizeGen3SaveBuffer = (fileBuffer: Buffer): Buffer => {
    // Return standard single-slot saves unchanged.
    if (fileBuffer.length === STANDARD_SINGLE_SLOT_SIZE_BYTES) {
        return fileBuffer;
    }

    // Return standard double-slot saves unchanged.
    if (fileBuffer.length === STANDARD_DOUBLE_SLOT_SIZE_BYTES) {
        return fileBuffer;
    }

    // Trim known padded emulator saves down to the expected double-slot size.
    if (fileBuffer.length === EMULATOR_PADDED_DOUBLE_SLOT_SIZE_BYTES) {
        return fileBuffer.subarray(0, STANDARD_DOUBLE_SLOT_SIZE_BYTES);
    }

    // Leave unknown sizes untouched so validation stays explicit in the caller.
    return fileBuffer;
};
