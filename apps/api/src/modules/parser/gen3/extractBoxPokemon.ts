import {
    decryptGen3StoredPokemon,
    isPresentGen3StoredPokemon,
    isValidGen3StoredPokemon,
    readGen3SpeciesId
} from "./gen3PokemonCrypto";
import type { ParsedGen3Pokemon } from "./extractPartyPokemon";
import type { Gen3SaveSection } from "./readGen3SaveSections";

type ExtractBoxPokemonParams = {
    // Provides the parsed Gen 3 save sections keyed by section id for PC storage extraction.
    sectionsById: Map<number, Gen3SaveSection>;
};

// Defines how many PC boxes FRLG and Emerald expose in Gen 3 save storage.
const BOX_COUNT = 14;
// Defines how many stored Pokemon entries exist in each PC box.
const SLOTS_PER_BOX = 30;
// Defines the byte size of one encrypted stored Pokemon structure.
const STORED_SLOT_SIZE_BYTES = 80;
// Defines the byte size of the shared PC storage header before box slot data begins.
const STORAGE_HEADER_SIZE_BYTES = 4;
// Caps accepted species ids to the Gen 3 National Dex range supported by the parser.
const MAX_GEN3_NATIONAL_DEX_NUMBER = 386;

const getStorageBlock = (
    sectionsById: Map<number, Gen3SaveSection>
): Buffer => {
    // Collects the contiguous save sections that make up boxed Pokemon storage.
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
    // Reads the combined PC storage block from save sections 5-13.
    const storageBlock = getStorageBlock(sectionsById);

    // Collects valid parsed boxed Pokemon entries for the dashboard and living dex logic.
    const parsedBoxPokemon: ParsedGen3Pokemon[] = [];

    for (let boxIndex = 0; boxIndex < BOX_COUNT; boxIndex += 1) {
        // Computes the byte offset for the start of one PC box inside the storage block.
        const boxOffset =
            STORAGE_HEADER_SIZE_BYTES +
            (boxIndex * SLOTS_PER_BOX * STORED_SLOT_SIZE_BYTES);

        for (let slotIndex = 0; slotIndex < SLOTS_PER_BOX; slotIndex += 1) {
            // Computes the byte range for one stored Pokemon slot.
            const slotOffset = boxOffset + (slotIndex * STORED_SLOT_SIZE_BYTES);
            const slotEnd = slotOffset + STORED_SLOT_SIZE_BYTES;

            // Reads the encrypted/raw stored Pokemon bytes from the storage block.
            const encryptedStoredPokemon = storageBlock.subarray(slotOffset, slotEnd);

            // Tracks the absolute slot index across all PC boxes for UI/debug references.
            const absoluteSlotIndex = (boxIndex * SLOTS_PER_BOX) + slotIndex;

            // Reads the personality value from the slot header for checksum-failure logging context.
            const personalityValue = encryptedStoredPokemon.readUInt32LE(0);

            // Reads the original trainer ID value from the slot header for debugging storage decoding.
            const originalTrainerId = encryptedStoredPokemon.readUInt32LE(4);

            // Skips raw PC slots that do not advertise a present Gen 3 Pokemon before decryption.
            if (!isPresentGen3StoredPokemon(encryptedStoredPokemon)) {
                continue;
            }

            // Decrypts the stored Gen 3 Pokemon structure using personality and OT-based crypto rules.
            const decryptedStoredPokemon = decryptGen3StoredPokemon(
                Buffer.from(encryptedStoredPokemon)
            );

            // Validates the decrypted slot checksum before trusting any parsed boxed Pokemon fields.
            const hasValidChecksum = isValidGen3StoredPokemon(decryptedStoredPokemon);

            if (!hasValidChecksum) {
                console.log("Skipping checksum-invalid box Pokemon slot", {
                    boxIndex,
                    slotIndex,
                    absoluteSlotIndex,
                    personalityValue,
                    originalTrainerId
                });
                continue;
            }

            // Reads the species id from the decrypted stored Pokemon data.
            const speciesId = readGen3SpeciesId(decryptedStoredPokemon);

            // Validates that the species id is in the supported Gen 3 National Dex range.
            const isValidSpeciesId = speciesId > 0 && speciesId <= MAX_GEN3_NATIONAL_DEX_NUMBER;

            if (!isValidSpeciesId) {
                console.log("Skipping invalid box Pokémon slot", {
                    boxIndex,
                    slotIndex,
                    absoluteSlotIndex,
                    personalityValue,
                    originalTrainerId,
                    speciesId
                });
                continue;
            }

            // Adds a valid boxed Pokemon entry that feeds living dex and detail UI state.
            parsedBoxPokemon.push({
                slotIndex: absoluteSlotIndex,
                speciesId,
                level: 0,
                nickname: "",
                isEgg: false
            });
        }
    }

    return parsedBoxPokemon;
};
