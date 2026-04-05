const SECTION_COUNT = 14;
const SECTION_SIZE_BYTES = 4096;
const SAVE_SLOT_SIZE_BYTES = 57344;

const SECTION_ID_OFFSET = 0x0ff4;
const CHECKSUM_OFFSET = 0x0ff6;
const SAVE_INDEX_OFFSET = 0x0ffc;
const SECTION_DATA_END_OFFSET = 0x0ff4;
// ERASED_SAVE_INDEX marks an uninitialized Gen 3 save footer that should never win active-slot selection.
const ERASED_SAVE_INDEX = 0xffffffff;

// Gen3SectionFooter stores the metadata footer read from one raw Gen 3 save section.
type Gen3SectionFooter = {
    sectionId: number;
    checksum: number;
    saveIndex: number;
};

// Gen3SaveSection stores one parsed Gen 3 save section plus the footer values used during slot assembly.
export type Gen3SaveSection = {
    sectionId: number;
    saveIndex: number;
    data: Buffer;
    raw: Buffer;
};

// ReadGen3SaveSectionsResult exposes the chosen active save index and the assembled active sections map.
export type ReadGen3SaveSectionsResult = {
    activeSaveIndex: number;
    sectionsById: Map<number, Gen3SaveSection>;
};

// SaveIndexCandidateSummary captures how one grouped save index scored during active-slot selection.
type SaveIndexCandidateSummary = {
    saveIndex: number;
    count: number;
    sectionIds: number[];
    uniqueValidSectionIds: number[];
    hasErasedSaveIndex: boolean;
    hasOnlyValidSectionIds: boolean;
    hasCompleteSectionSet: boolean;
};

// readSectionFooter reads the footer metadata used to group and rank Gen 3 save sections.
const readSectionFooter = (sectionBuffer: Buffer): Gen3SectionFooter => {
    const sectionId = sectionBuffer.readUInt16LE(SECTION_ID_OFFSET);
    const checksum = sectionBuffer.readUInt16LE(CHECKSUM_OFFSET);
    const saveIndex = sectionBuffer.readUInt32LE(SAVE_INDEX_OFFSET);

    return {
        sectionId,
        checksum,
        saveIndex
    };
};

// readSaveSlotSections reads all 14 raw sections from one physical save slot block.
const readSaveSlotSections = (
    saveSlotBuffer: Buffer
): Gen3SaveSection[] => {
    const sections: Gen3SaveSection[] = [];

    for (let sectionIndex = 0; sectionIndex < SECTION_COUNT; sectionIndex += 1) {
        const sectionStart = sectionIndex * SECTION_SIZE_BYTES;
        const sectionEnd = sectionStart + SECTION_SIZE_BYTES;
        const sectionBuffer = saveSlotBuffer.subarray(sectionStart, sectionEnd);

        const footer = readSectionFooter(sectionBuffer);

        console.log("readSaveSlotSections footer", {
            sectionIndex,
            sectionId: footer.sectionId,
            checksum: footer.checksum,
            saveIndex: footer.saveIndex
        });

        sections.push({
            sectionId: footer.sectionId,
            saveIndex: footer.saveIndex,
            data: sectionBuffer.subarray(0, SECTION_DATA_END_OFFSET),
            raw: sectionBuffer
        });
    }

    return sections;
};

// groupSectionsBySaveIndex merges both physical save slots into logical save-index groups for selection.
const groupSectionsBySaveIndex = (
    firstSlotSections: Gen3SaveSection[],
    secondSlotSections: Gen3SaveSection[]
): Map<number, Gen3SaveSection[]> => {
    const sectionsBySaveIndex = new Map<number, Gen3SaveSection[]>();

    const allSections = firstSlotSections.concat(secondSlotSections);

    for (const section of allSections) {
        const existingSections = sectionsBySaveIndex.get(section.saveIndex);

        if (existingSections) {
            existingSections.push(section);
        } else {
            sectionsBySaveIndex.set(section.saveIndex, [section]);
        }
    }

    return sectionsBySaveIndex;
};

// getIsValidGen3SectionId checks whether one footer section id is in the real Gen 3 section range.
const getIsValidGen3SectionId = (sectionId: number): boolean => {
    return sectionId >= 0 && sectionId < SECTION_COUNT;
};

// getUniqueValidSectionIds collects deduplicated valid section ids so slot selection can require a full set.
const getUniqueValidSectionIds = (sections: Gen3SaveSection[]): number[] => {
    const uniqueSectionIds = new Set<number>();

    for (const section of sections) {
        if (getIsValidGen3SectionId(section.sectionId)) {
            uniqueSectionIds.add(section.sectionId);
        }
    }

    return Array.from(uniqueSectionIds).sort((leftSectionId, rightSectionId) => {
        return leftSectionId - rightSectionId;
    });
};

// summarizeSaveIndexCandidate derives the structural validity flags used to ignore erased and incomplete slots.
const summarizeSaveIndexCandidate = (
    saveIndex: number,
    sections: Gen3SaveSection[]
): SaveIndexCandidateSummary => {
    const uniqueValidSectionIds = getUniqueValidSectionIds(sections);
    const hasOnlyValidSectionIds = sections.every((section) => {
        return getIsValidGen3SectionId(section.sectionId);
    });

    return {
        saveIndex,
        count: sections.length,
        sectionIds: sections.map((section) => {
            return section.sectionId;
        }),
        uniqueValidSectionIds,
        hasErasedSaveIndex: saveIndex === ERASED_SAVE_INDEX,
        hasOnlyValidSectionIds,
        hasCompleteSectionSet: hasOnlyValidSectionIds && uniqueValidSectionIds.length === SECTION_COUNT
    };
};

// getActiveSaveIndex picks the newest structurally valid Gen 3 save index and ignores erased slot footers.
const getActiveSaveIndex = (
    sectionsBySaveIndex: Map<number, Gen3SaveSection[]>
): number => {
    const saveIndexSummary = Array.from(sectionsBySaveIndex.entries()).map(
        ([saveIndex, sections]) => {
            return summarizeSaveIndexCandidate(saveIndex, sections);
        }
    );

    console.log("sectionsBySaveIndex summary", saveIndexSummary);

    const candidateSaveIndexes = saveIndexSummary
        .filter((saveIndexCandidateSummary) => {
            return !saveIndexCandidateSummary.hasErasedSaveIndex &&
                saveIndexCandidateSummary.hasOnlyValidSectionIds &&
                saveIndexCandidateSummary.hasCompleteSectionSet;
        })
        .map((saveIndexCandidateSummary) => {
            return saveIndexCandidateSummary.saveIndex;
        });

    if (candidateSaveIndexes.length === 0) {
        throw new Error("No complete Gen 3 save slot found");
    }

    return Math.max(...candidateSaveIndexes);
};

// readGen3SaveSections reads both physical Gen 3 slots, selects the active logical save, and assembles sections by id.
export const readGen3SaveSections = (
    fileBuffer: Buffer
): ReadGen3SaveSectionsResult => {
    console.log("readGen3SaveSections entered", {
        fileSizeBytes: fileBuffer.length
    });

    if (fileBuffer.length < SAVE_SLOT_SIZE_BYTES * 2) {
        throw new Error(`Unexpected Gen 3 save size: ${fileBuffer.length}`);
    }

    const firstSlotBuffer = fileBuffer.subarray(0, SAVE_SLOT_SIZE_BYTES);
    const secondSlotBuffer = fileBuffer.subarray(
        SAVE_SLOT_SIZE_BYTES,
        SAVE_SLOT_SIZE_BYTES * 2
    );

    const firstSlotSections = readSaveSlotSections(firstSlotBuffer);
    const secondSlotSections = readSaveSlotSections(secondSlotBuffer);

    const sectionsBySaveIndex = groupSectionsBySaveIndex(
        firstSlotSections,
        secondSlotSections
    );

    const activeSaveIndex = getActiveSaveIndex(sectionsBySaveIndex);
    const activeSections = sectionsBySaveIndex.get(activeSaveIndex);

    if (!activeSections) {
        throw new Error("Active Gen 3 save slot could not be loaded");
    }

    const sectionsById = new Map<number, Gen3SaveSection>();

    for (const section of activeSections) {
        if (section.sectionId >= 0 && section.sectionId < SECTION_COUNT) {
            sectionsById.set(section.sectionId, section);
        }
    }

    if (sectionsById.size < SECTION_COUNT) {
        throw new Error("Active Gen 3 save slot is missing required sections");
    }

    return {
        activeSaveIndex,
        sectionsById
    };
};
