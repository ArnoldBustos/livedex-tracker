import {
    decryptGen3StoredPokemon,
    readGen3SpeciesId
} from "./gen3PokemonCrypto";
import type { Gen3Layout } from "./detectGen3Game";
import type { Gen3SaveSection } from "./readGen3SaveSections";

export type ParsedGen3Pokemon = {
    slotIndex: number;
    speciesId: number;
    level: number;
    nickname: string;
    isEgg: boolean;
};

type ExtractPartyPokemonParams = {
    // layout selects the party offsets for Ruby/Sapphire, Emerald, or FRLG parsing.
    layout: Gen3Layout;
    // sectionsById provides the active save sections needed to assemble the large data block.
    sectionsById: Map<number, Gen3SaveSection>;
};

// PARTY_LAYOUTS centralizes per-game-family offsets so Ruby/Sapphire, Emerald, and FRLG stay modular.
const PARTY_LAYOUTS: Partial<
    Record<
        Gen3Layout,
        {
            partyCountOffset: number;
            partyBufferOffset: number;
        }
    >
> = {
    RUBY_SAPPHIRE: {
        partyCountOffset: 0x0234,
        partyBufferOffset: 0x0238
    },
    EMERALD: {
        partyCountOffset: 0x0234,
        partyBufferOffset: 0x0238
    },
    FRLG: {
        partyCountOffset: 0x0034,
        partyBufferOffset: 0x0038
    }
};

// PARTY_SLOT_SIZE_BYTES is the full 100-byte in-party Pokemon structure size.
const PARTY_SLOT_SIZE_BYTES = 100;
// MAX_PARTY_COUNT caps the parser to the in-game six-Pokemon team limit.
const MAX_PARTY_COUNT = 6;

// getLargeBlock stitches sections 1-4 into the contiguous block used by party parsing.
const getLargeBlock = (
    sectionsById: Map<number, Gen3SaveSection>
): Buffer => {
    const sectionOne = sectionsById.get(1);
    const sectionTwo = sectionsById.get(2);
    const sectionThree = sectionsById.get(3);
    const sectionFour = sectionsById.get(4);

    if (!sectionOne || !sectionTwo || !sectionThree || !sectionFour) {
        throw new Error("Missing Gen 3 large block sections");
    }

    return Buffer.concat([
        sectionOne.data,
        sectionTwo.data,
        sectionThree.data,
        sectionFour.data
    ]);
};

export const extractPartyPokemon = ({
    layout,
    sectionsById
}: ExtractPartyPokemonParams): ParsedGen3Pokemon[] => {
    // partyLayout provides the correct section 1 offsets for the detected Gen 3 layout family.
    const partyLayout = PARTY_LAYOUTS[layout];

    if (!partyLayout) {
        throw new Error(`Gen 3 ${layout} party offsets are not implemented`);
    }

    const largeBlock = getLargeBlock(sectionsById);
    const rawPartyCount = largeBlock.readUInt8(partyLayout.partyCountOffset);
    const partyCount = Math.min(rawPartyCount, MAX_PARTY_COUNT);

    const parsedPartyPokemon: ParsedGen3Pokemon[] = [];

    for (let slotIndex = 0; slotIndex < partyCount; slotIndex += 1) {
        const slotStart = partyLayout.partyBufferOffset + (slotIndex * PARTY_SLOT_SIZE_BYTES);
        const slotEnd = slotStart + PARTY_SLOT_SIZE_BYTES;
        const encryptedPartyPokemon = largeBlock.subarray(slotStart, slotEnd);
        const decryptedPartyPokemon = decryptGen3StoredPokemon(
            Buffer.from(encryptedPartyPokemon)
        );

        const speciesId = readGen3SpeciesId(decryptedPartyPokemon);
        const level = decryptedPartyPokemon.readUInt8(84);
        const nickname = "";
        const isEgg = false;

        if (speciesId <= 0) {
            continue;
        }

        parsedPartyPokemon.push({
            slotIndex,
            speciesId,
            level,
            nickname,
            isEgg
        });
    }

    return parsedPartyPokemon;
};
