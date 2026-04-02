import {
    decryptGen3StoredPokemon,
    readGen3SpeciesId
} from "./gen3PokemonCrypto";
import type { Gen3SaveSection } from "./readGen3SaveSections";

export type ParsedGen3Pokemon = {
    slotIndex: number;
    speciesId: number;
    level: number;
    nickname: string;
    isEgg: boolean;
};

type ExtractPartyPokemonParams = {
    sectionsById: Map<number, Gen3SaveSection>;
};

const PARTY_COUNT_OFFSET = 0x034;
const PARTY_BUFFER_OFFSET = 0x038;
const PARTY_SLOT_SIZE_BYTES = 100;
const MAX_PARTY_COUNT = 6;

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
    sectionsById
}: ExtractPartyPokemonParams): ParsedGen3Pokemon[] => {
    const largeBlock = getLargeBlock(sectionsById);
    const rawPartyCount = largeBlock.readUInt8(PARTY_COUNT_OFFSET);
    const partyCount = Math.min(rawPartyCount, MAX_PARTY_COUNT);

    const parsedPartyPokemon: ParsedGen3Pokemon[] = [];

    for (let slotIndex = 0; slotIndex < partyCount; slotIndex += 1) {
        const slotStart = PARTY_BUFFER_OFFSET + (slotIndex * PARTY_SLOT_SIZE_BYTES);
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