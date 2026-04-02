const STORED_SLOT_SIZE_BYTES = 80;
const STORED_HEADER_SIZE_BYTES = 32;
const STORED_BLOCK_SIZE_BYTES = 12;

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

export const readGen3SpeciesId = (decryptedPokemon: Buffer): number => {
    return decryptedPokemon.readUInt16LE(32);
};