import type { Gen3Layout } from "./detectGen3Game";
import type { Gen3SaveSection } from "./readGen3SaveSections";

// ExtractedPokedexFlags exposes the parsed Gen 3 seen and owned National Dex entries to save parsing.
export type ExtractedPokedexFlags = {
    seenNationalDexNumbers: number[];
    ownedNationalDexNumbers: number[];
};

// ExtractPokedexFlagsParams provides the detected layout and loaded save sections for section 0 Pokedex reads.
type ExtractPokedexFlagsParams = {
    // layout selects the correct section 0 Pokedex offsets for FRLG versus Emerald parsing.
    layout: Gen3Layout;
    // sectionsById provides the active save sections needed to read section 0 Pokedex flags.
    sectionsById: Map<number, Gen3SaveSection>;
};

// PokedexLayoutDefinition groups the section id and bitfield offsets for one supported Gen 3 layout family.
type PokedexLayoutDefinition = {
    sectionId: number;
    caughtOffset: number;
    seenOffset: number;
};

// POKEDEX_LAYOUTS centralizes per-layout section 0 offsets so Gen 3 flag parsing stays modular.
const POKEDEX_LAYOUTS: Partial<Record<Gen3Layout, PokedexLayoutDefinition>> = {
    EMERALD: {
        sectionId: 0,
        caughtOffset: 0x0028,
        seenOffset: 0x005c
    },
    FRLG: {
        sectionId: 0,
        caughtOffset: 0x0028,
        seenOffset: 0x005c
    }
};

// MAX_SPECIES caps extracted flags to the Gen 3 National Dex range.
const MAX_SPECIES = 386;
// POKEDEX_FLAG_BYTE_LENGTH is the number of bytes required to cover the Gen 3 National Dex bitfield.
const POKEDEX_FLAG_BYTE_LENGTH = Math.ceil(MAX_SPECIES / 8);

// assertDexFlagRange verifies that a bitfield block fits inside the selected save section before parsing.
const assertDexFlagRange = (
    sectionData: Buffer,
    baseOffset: number,
    label: "seen" | "owned",
    layout: Gen3Layout
): void => {
    const endOffset = baseOffset + POKEDEX_FLAG_BYTE_LENGTH;

    if (endOffset > sectionData.length) {
        throw new Error(
            `Gen 3 ${layout} ${label} Pokedex flags exceed section bounds at 0x${baseOffset.toString(16)}`
        );
    }
};

// extractDexFlags reads a Gen 3 National Dex bitfield block and returns the set National Dex numbers.
const extractDexFlags = (sectionData: Buffer, baseOffset: number): number[] => {
    const results: number[] = [];

    for (let species = 1; species <= MAX_SPECIES; species += 1) {
        const bitIndex = species - 1;
        const byteOffset = bitIndex >> 3;
        const bitInByte = bitIndex & 7;
        const byteValue = sectionData[baseOffset + byteOffset];
        const isSet = (byteValue & (1 << bitInByte)) !== 0;

        if (isSet) {
            results.push(species);
        }
    }

    return results;
};

// extractPokedexFlags reads section 0 Pokedex bitfields for the detected Gen 3 layout and returns parsed flags.
export const extractPokedexFlags = ({
    layout,
    sectionsById
}: ExtractPokedexFlagsParams): ExtractedPokedexFlags => {
    // pokedexLayout provides the section id and bitfield offsets for the detected Gen 3 layout family.
    const pokedexLayout = POKEDEX_LAYOUTS[layout];

    if (!pokedexLayout) {
        throw new Error(`Gen 3 ${layout} Pokedex offsets are not implemented`);
    }

    const pokedexSection = sectionsById.get(pokedexLayout.sectionId);

    if (!pokedexSection) {
        throw new Error(`Missing Gen 3 section ${pokedexLayout.sectionId} for Pokedex flags`);
    }

    // sectionData is the active save section payload that contains the selected layout's Pokedex bitfields.
    const sectionData = pokedexSection.data;

    assertDexFlagRange(sectionData, pokedexLayout.seenOffset, "seen", layout);
    assertDexFlagRange(sectionData, pokedexLayout.caughtOffset, "owned", layout);

    const seenNationalDexNumbers = extractDexFlags(sectionData, pokedexLayout.seenOffset);
    const ownedNationalDexNumbers = extractDexFlags(sectionData, pokedexLayout.caughtOffset);

    return {
        seenNationalDexNumbers,
        ownedNationalDexNumbers
    };
};
