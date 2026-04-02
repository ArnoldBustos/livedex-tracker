import {
    decryptGen3StoredPokemon,
    readGen3SpeciesId
} from "./gen3PokemonCrypto";
import type { ParsedGen3Pokemon } from "./extractPartyPokemon";
import type { Gen3SaveSection } from "./readGen3SaveSections";

type ExtractBoxPokemonParams = {
    sectionsById: Map<number, Gen3SaveSection>;
};

const BOX_COUNT = 14;
const SLOTS_PER_BOX = 30;
const STORED_SLOT_SIZE_BYTES = 80;
const STORAGE_HEADER_SIZE_BYTES = 4;

const getStorageBlock = (
    sectionsById: Map<number, Gen3SaveSection>
): Buffer => {
    const storageSections: Buffer[] = [];

    for (let sectionId = 5; sectionId <= 13; sectionId += 1) {
        const section = sectionsById.get(sectionId);

        if (!section) {
            throw new Error(`Missing Gen 3 storage section ${sectionId}`);
        }

        storageSections.push(section.data);
    }

    return Buffer.concat(storageSections);
};

export const extractBoxPokemon = ({
    sectionsById
}: ExtractBoxPokemonParams): ParsedGen3Pokemon[] => {
    const storageBlock = getStorageBlock(sectionsById);
    const parsedBoxPokemon: ParsedGen3Pokemon[] = [];

    for (let boxIndex = 0; boxIndex < BOX_COUNT; boxIndex += 1) {
        const boxOffset =
            STORAGE_HEADER_SIZE_BYTES +
            (boxIndex * SLOTS_PER_BOX * STORED_SLOT_SIZE_BYTES);

        for (let slotIndex = 0; slotIndex < SLOTS_PER_BOX; slotIndex += 1) {
            const slotOffset = boxOffset + (slotIndex * STORED_SLOT_SIZE_BYTES);
            const slotEnd = slotOffset + STORED_SLOT_SIZE_BYTES;
            const encryptedStoredPokemon = storageBlock.subarray(slotOffset, slotEnd);
            const decryptedStoredPokemon = decryptGen3StoredPokemon(
                Buffer.from(encryptedStoredPokemon)
            );

            const speciesId = readGen3SpeciesId(decryptedStoredPokemon);

            if (speciesId <= 0) {
                continue;
            }

            parsedBoxPokemon.push({
                slotIndex: (boxIndex * SLOTS_PER_BOX) + slotIndex,
                speciesId,
                level: 0,
                nickname: "",
                isEgg: false
            });
        }
    }

    return parsedBoxPokemon;
};