// STORED_SLOT_SIZE_BYTES describes the full boxed/shared Gen 3 Pokemon structure size.
const STORED_SLOT_SIZE_BYTES = 80;
// STORED_HEADER_SIZE_BYTES marks where the encrypted 48-byte payload begins in the structure.
const STORED_HEADER_SIZE_BYTES = 32;
// STORED_BLOCK_SIZE_BYTES describes one 12-byte substructure inside the shuffled payload.
const STORED_BLOCK_SIZE_BYTES = 12;
// STORED_CHECKSUM_OFFSET points at the checksum field in the Gen 3 Pokemon header.
const STORED_CHECKSUM_OFFSET = 28;
// STORED_PRESENT_FLAG_OFFSET points at the raw header byte PKHeX uses for Gen 3 slot presence checks.
const STORED_PRESENT_FLAG_OFFSET = 0x13;
// STORED_PRESENT_FLAG_MASK clears the unsupported bits before comparing the Gen 3 presence state.
const STORED_PRESENT_FLAG_MASK = 0xfb;
// STORED_PRESENT_FLAG_VALUE is the raw flag value that marks a Gen 3 stored slot as occupied.
const STORED_PRESENT_FLAG_VALUE = 2;

// BLOCK_POSITION stores the Gen 3 shuffle permutations used to reorder the four encrypted substructures.
const BLOCK_POSITION = [
    0, 1, 2, 3, 0, 1, 3, 2, 0, 2, 1, 3, 0, 3, 1, 2,
    0, 2, 3, 1, 0, 3, 2, 1, 1, 0, 2, 3, 1, 0, 3, 2,
    2, 0, 1, 3, 3, 0, 1, 2, 2, 0, 3, 1, 3, 0, 2, 1,
    1, 2, 0, 3, 1, 3, 0, 2, 2, 1, 0, 3, 3, 1, 0, 2,
    2, 3, 0, 1, 3, 2, 0, 1, 1, 2, 3, 0, 1, 3, 2, 0,
    2, 1, 3, 0, 3, 1, 2, 0, 2, 3, 1, 0, 3, 2, 1, 0,

    0, 1, 2, 3, 0, 1, 3, 2, 0, 2, 1, 3, 0, 3, 1, 2,
    0, 2, 3, 1, 0, 3, 2, 1, 1, 0, 2, 3, 1, 0, 3, 2
];

const reverseGen3StoredShuffle = (
    storedData: Buffer,
    shuffleValue: number
): Buffer => {
    // Restores the decrypted 48-byte substructure block order using the Gen 3 shuffle table.
    if (shuffleValue === 0) {
        return Buffer.from(storedData);
    }

    const reorderedStoredData = Buffer.alloc(storedData.length);
    const permutationStart = shuffleValue * 4;

    for (let blockIndex = 0; blockIndex < 4; blockIndex += 1) {
        const sourceBlockPosition = BLOCK_POSITION[permutationStart + blockIndex];
        const sourceStart = sourceBlockPosition * STORED_BLOCK_SIZE_BYTES;
        const sourceEnd = sourceStart + STORED_BLOCK_SIZE_BYTES;
        const destinationStart = blockIndex * STORED_BLOCK_SIZE_BYTES;

        storedData.copy(
            reorderedStoredData,
            destinationStart,
            sourceStart,
            sourceEnd
        );
    }

    return reorderedStoredData;
};

export const decryptGen3StoredPokemon = (pokemonData: Buffer): Buffer => {
    // Decrypts and unshuffles the shared 80-byte Gen 3 Pokemon layout used by party and PC storage.
    const decryptedPokemon = Buffer.from(pokemonData);

    const personalityValue = decryptedPokemon.readUInt32LE(0);
    const originalTrainerId = decryptedPokemon.readUInt32LE(4);
    const seed = (personalityValue ^ originalTrainerId) >>> 0;
    const shuffleValue = personalityValue % 24;

    for (
        let offset = STORED_HEADER_SIZE_BYTES;
        offset < STORED_SLOT_SIZE_BYTES;
        offset += 4
    ) {
        const decryptedValue = (decryptedPokemon.readUInt32LE(offset) ^ seed) >>> 0;
        decryptedPokemon.writeUInt32LE(decryptedValue, offset);
    }

    const shuffledStoredData = decryptedPokemon.subarray(
        STORED_HEADER_SIZE_BYTES,
        STORED_SLOT_SIZE_BYTES
    );

    const reorderedStoredData = reverseGen3StoredShuffle(
        shuffledStoredData,
        shuffleValue
    );

    reorderedStoredData.copy(
        decryptedPokemon,
        STORED_HEADER_SIZE_BYTES,
        0,
        reorderedStoredData.length
    );

    return decryptedPokemon;
};

export const isPresentGen3StoredPokemon = (pokemonData: Buffer): boolean => {
    // Matches PKHeX's raw Gen 3 slot presence check before decrypting boxed Pokemon data.
    return (pokemonData[STORED_PRESENT_FLAG_OFFSET] & STORED_PRESENT_FLAG_MASK) ===
        STORED_PRESENT_FLAG_VALUE;
};

export const readGen3SpeciesId = (decryptedPokemon: Buffer): number => {
    // Reads the species id from the first word of the reordered Gen 3 growth substructure.
    return decryptedPokemon.readUInt16LE(32);
};

export const readGen3StoredChecksum = (decryptedPokemon: Buffer): number => {
    // Reads the checksum stored in the Gen 3 Pokemon header so parser callers can validate decrypted data.
    return decryptedPokemon.readUInt16LE(STORED_CHECKSUM_OFFSET);
};

export const calculateGen3StoredChecksum = (decryptedPokemon: Buffer): number => {
    // Recomputes the checksum across the reordered 48-byte payload shared by party and boxed Pokemon.
    let checksum = 0;

    for (
        let offset = STORED_HEADER_SIZE_BYTES;
        offset < STORED_SLOT_SIZE_BYTES;
        offset += 2
    ) {
        checksum = (checksum + decryptedPokemon.readUInt16LE(offset)) & 0xffff;
    }

    return checksum;
};

export const isValidGen3StoredPokemon = (decryptedPokemon: Buffer): boolean => {
    // Confirms the decrypted payload checksum matches the stored header checksum before field parsing.
    return readGen3StoredChecksum(decryptedPokemon) ===
        calculateGen3StoredChecksum(decryptedPokemon);
};
