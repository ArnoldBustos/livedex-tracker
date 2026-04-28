import { GEN3_MAX_NATIONAL_DEX_NUMBER } from "../../../../../../packages/shared/src";
import type { Gen3Layout } from "./detectGen3Game";
import type { Gen3SaveSection } from "./readGen3SaveSections";

// ExtractedPokedexFlags exposes the parsed Gen 3 seen and owned National Dex entries plus unlock state to save parsing.
export type ExtractedPokedexFlags = {
    seenNationalDexNumbers: number[];
    ownedNationalDexNumbers: number[];
    hasNationalDex: boolean;
};

// ExtractPokedexFlagsParams provides the detected layout and loaded save sections for section 0 Pokedex reads.
type ExtractPokedexFlagsParams = {
    // layout selects the correct section 0 Pokedex offsets for Ruby/Sapphire, Emerald, or FRLG parsing.
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

// POKEDEX_LAYOUTS centralizes per-layout section 0 offsets so Ruby/Sapphire, Emerald, and FRLG stay modular.
const POKEDEX_LAYOUTS: Partial<Record<Gen3Layout, PokedexLayoutDefinition>> = {
    RUBY_SAPPHIRE: {
        sectionId: 0,
        caughtOffset: 0x0028,
        seenOffset: 0x005c
    },
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
const MAX_SPECIES = GEN3_MAX_NATIONAL_DEX_NUMBER;
// POKEDEX_FLAG_BYTE_LENGTH is the number of bytes required to cover the Gen 3 National Dex bitfield.
const POKEDEX_FLAG_BYTE_LENGTH = Math.ceil(MAX_SPECIES / 8);
// POKEDEX_MODE_OFFSET stores the RSE Pokedex mode byte inside the small-block Pokedex structure.
const POKEDEX_MODE_OFFSET = 0x19;
// POKEDEX_NATIONAL_MAGIC_RSE_OFFSET stores the RSE National Dex unlock byte used by Ruby/Sapphire and Emerald.
const POKEDEX_NATIONAL_MAGIC_RSE_OFFSET = 0x1a;
// POKEDEX_NATIONAL_MAGIC_FRLG_OFFSET stores the FRLG National Dex unlock byte inside the small block.
const POKEDEX_NATIONAL_MAGIC_FRLG_OFFSET = 0x1b;
// POKEDEX_NATIONAL_UNLOCK_RSE is the PKHeX-documented unlock byte for Ruby/Sapphire and Emerald National Dex state.
const POKEDEX_NATIONAL_UNLOCK_RSE = 0xda;
// POKEDEX_NATIONAL_UNLOCK_FRLG is the PKHeX-documented unlock byte for FireRed/LeafGreen National Dex state.
const POKEDEX_NATIONAL_UNLOCK_FRLG = 0xb9;
// POKEDEX_MODE_NATIONAL identifies the RSE Pokedex mode value for National Dex view.
const POKEDEX_MODE_NATIONAL = 1;

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

// getHasNationalDex reads the small-block National Dex markers for the detected Gen 3 layout.
const getHasNationalDex = ({
    sectionData,
    layout
}: {
    sectionData: Buffer;
    layout: Gen3Layout;
}): boolean => {
    if (layout === "FRLG") {
        return sectionData.readUInt8(POKEDEX_NATIONAL_MAGIC_FRLG_OFFSET) ===
            POKEDEX_NATIONAL_UNLOCK_FRLG;
    }

    return sectionData.readUInt8(POKEDEX_MODE_OFFSET) === POKEDEX_MODE_NATIONAL &&
        sectionData.readUInt8(POKEDEX_NATIONAL_MAGIC_RSE_OFFSET) ===
            POKEDEX_NATIONAL_UNLOCK_RSE;
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

    const hasNationalDex = getHasNationalDex({
        sectionData,
        layout
    });
    const seenNationalDexNumbers = extractDexFlags(sectionData, pokedexLayout.seenOffset);
    const ownedNationalDexNumbers = extractDexFlags(sectionData, pokedexLayout.caughtOffset);

    return {
        seenNationalDexNumbers,
        ownedNationalDexNumbers,
        hasNationalDex
    };
};
