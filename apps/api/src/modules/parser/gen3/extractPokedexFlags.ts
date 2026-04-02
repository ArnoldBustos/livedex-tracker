import type { Gen3SaveSection } from "./readGen3SaveSections";

export type ExtractedPokedexFlags = {
    seenNationalDexNumbers: number[];
    ownedNationalDexNumbers: number[];
};

type ExtractPokedexFlagsParams = {
    activeSaveIndex: number;
    sectionsById: Map<number, Gen3SaveSection>;
};

const toHexPreview = (
    buffer: Buffer,
    startOffset: number,
    length: number
): string => {
    const endOffset = Math.min(startOffset + length, buffer.length);
    const slice = buffer.subarray(startOffset, endOffset);

    return Array.from(slice).map((byteValue) => {
        return byteValue.toString(16).padStart(2, "0");
    }).join(" ");
};

const extractSetBits = (buffer: Buffer): number[] => {
    const results: number[] = [];

    for (let byteIndex = 0; byteIndex < buffer.length; byteIndex += 1) {
        const byteValue = buffer[byteIndex];

        for (let bitIndex = 0; bitIndex < 8; bitIndex += 1) {
            const isSet = (byteValue & (1 << bitIndex)) !== 0;

            if (isSet) {
                const nationalDexNumber = byteIndex * 8 + bitIndex + 1;
                results.push(nationalDexNumber);
            }
        }
    }

    return results;
};

export const extractPokedexFlags = ({
    activeSaveIndex,
    sectionsById
}: ExtractPokedexFlagsParams): ExtractedPokedexFlags => {
    console.log("extractPokedexFlags activeSaveIndex", activeSaveIndex);
    console.log(
        "extractPokedexFlags sectionIds",
        Array.from(sectionsById.keys()).sort((leftSectionId, rightSectionId) => {
            return leftSectionId - rightSectionId;
        })
    );

    const sectionZero = sectionsById.get(0);

    if (!sectionZero) {
        throw new Error("Missing Gen 3 section 0");
    }

    console.log("extractPokedexFlags focusing on section 0 bitfield region");

    const POKEDEX_BASE_OFFSET = 0x18;

    const SEEN_OFFSET = POKEDEX_BASE_OFFSET + 0x44;
    const CAUGHT_OFFSET = POKEDEX_BASE_OFFSET + 0x10;

    const MAX_SPECIES = 386;

    const small = sectionZero.data;

    const extractDexFlags = (baseOffset: number): number[] => {
        const results: number[] = [];

        for (let species = 1; species <= MAX_SPECIES; species += 1) {
            const bitIndex = species - 1;
            const byteOffset = bitIndex >> 3;
            const bitInByte = bitIndex & 7;

            const byteValue = small[baseOffset + byteOffset];
            const isSet = (byteValue & (1 << bitInByte)) !== 0;

            if (isSet) {
                results.push(species);
            }
        }

        return results;
    };

    const seenNationalDexNumbers = extractDexFlags(SEEN_OFFSET);
    const ownedNationalDexNumbers = extractDexFlags(CAUGHT_OFFSET);

    console.log("extractPokedexFlags PKHeX offsets", {
        seenOffset: SEEN_OFFSET,
        caughtOffset: CAUGHT_OFFSET,
        seenCount: seenNationalDexNumbers.length,
        ownedCount: ownedNationalDexNumbers.length,
        seenFirst20: seenNationalDexNumbers.slice(0, 20),
        ownedFirst20: ownedNationalDexNumbers.slice(0, 20)
    });

    return {
        seenNationalDexNumbers,
        ownedNationalDexNumbers
    };
};