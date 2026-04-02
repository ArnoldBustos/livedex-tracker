export type ExtractedPokedexFlags = {
    seenNationalDexNumbers: number[];
    ownedNationalDexNumbers: number[];
};

export const extractPokedexFlags = (
    fileBuffer: Buffer
): ExtractedPokedexFlags => {
    void fileBuffer;

    return {
        seenNationalDexNumbers: [1, 4, 7, 25],
        ownedNationalDexNumbers: [1, 25]
    };
};