import type { Gen3Layout } from "./detectGen3Game";
import type { Gen3SaveSection } from "./readGen3SaveSections";

export type ExtractedPokedexFlags = {
    seenNationalDexNumbers: number[];
    ownedNationalDexNumbers: number[];
};

type ExtractPokedexFlagsParams = {
    // layout selects the correct section 0 Pokedex offsets for FRLG versus Emerald parsing.
    layout: Gen3Layout;
    // sectionsById provides the active save sections needed to read section 0 Pokedex flags.
    sectionsById: Map<number, Gen3SaveSection>;
};

// POKEDEX_LAYOUTS centralizes per-layout section 0 offsets so Gen 3 flag parsing stays modular.
const POKEDEX_LAYOUTS: Record<
    Gen3Layout,
    {
        caughtOffset: number;
        seenOffset: number;
    }
> = {
    EMERALD: {
        caughtOffset: 0x0028,
        seenOffset: 0x005c
    },
    FRLG: {
        caughtOffset: 0x0028,
        seenOffset: 0x005c
    }
};

// MAX_SPECIES caps extracted flags to the Gen 3 National Dex range.
const MAX_SPECIES = 386;

export const extractPokedexFlags = ({
    layout,
    sectionsById
}: ExtractPokedexFlagsParams): ExtractedPokedexFlags => {
    const sectionZero = sectionsById.get(0);

    if (!sectionZero) {
        throw new Error("Missing Gen 3 section 0");
    }

    const small = sectionZero.data;
    // pokedexLayout provides the section 0 offsets for the detected Gen 3 layout family.
    const pokedexLayout = POKEDEX_LAYOUTS[layout];

    // extractDexFlags reads one bitfield block into National Dex numbers for save sync and debug output.
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

    const seenNationalDexNumbers = extractDexFlags(pokedexLayout.seenOffset);
    const ownedNationalDexNumbers = extractDexFlags(pokedexLayout.caughtOffset);

    return {
        seenNationalDexNumbers,
        ownedNationalDexNumbers
    };
};
