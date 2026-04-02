import type { Gen3SaveSection } from "./readGen3SaveSections";

export type ExtractedPokedexFlags = {
    seenNationalDexNumbers: number[];
    ownedNationalDexNumbers: number[];
};

type ExtractPokedexFlagsParams = {
    sectionsById: Map<number, Gen3SaveSection>;
};

const POKEDEX_BASE_OFFSET = 0x18;
const CAUGHT_OFFSET = POKEDEX_BASE_OFFSET + 0x10;
const SEEN_OFFSET = POKEDEX_BASE_OFFSET + 0x44;
const MAX_SPECIES = 386;

export const extractPokedexFlags = ({
    sectionsById
}: ExtractPokedexFlagsParams): ExtractedPokedexFlags => {
    const sectionZero = sectionsById.get(0);

    if (!sectionZero) {
        throw new Error("Missing Gen 3 section 0");
    }

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

    return {
        seenNationalDexNumbers,
        ownedNationalDexNumbers
    };
};