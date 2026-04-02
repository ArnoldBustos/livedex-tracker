import { readGen3SaveSections } from "./readGen3SaveSections";

export type ExtractedPokedexFlags = {
    seenNationalDexNumbers: number[];
    ownedNationalDexNumbers: number[];
};

export const extractPokedexFlags = (
    fileBuffer: Buffer
): ExtractedPokedexFlags => {
    const { activeSaveIndex, sectionsById } = readGen3SaveSections(fileBuffer);

    console.log("extractPokedexFlags activeSaveIndex", activeSaveIndex);
    console.log(
        "extractPokedexFlags sectionIds",
        Array.from(sectionsById.keys()).sort((leftSectionId, rightSectionId) => {
            return leftSectionId - rightSectionId;
        })
    );

    return {
        seenNationalDexNumbers: [],
        ownedNationalDexNumbers: []
    };
};