import type { Gen3SaveSection } from "./readGen3SaveSections";

export type ExtractedPokedexFlags = {
    seenNationalDexNumbers: number[];
    ownedNationalDexNumbers: number[];
};

type ExtractPokedexFlagsParams = {
    activeSaveIndex: number;
    sectionsById: Map<number, Gen3SaveSection>;
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

    return {
        seenNationalDexNumbers: [],
        ownedNationalDexNumbers: []
    };
};