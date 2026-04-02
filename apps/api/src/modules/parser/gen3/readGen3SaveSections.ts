const SECTION_COUNT = 14;
const SECTION_SIZE_BYTES = 4096;
const SAVE_SLOT_SIZE_BYTES = 57344;

const SECTION_ID_OFFSET = 0x0ff4;
const CHECKSUM_OFFSET = 0x0ff6;
const SAVE_INDEX_OFFSET = 0x0ffc;
const SECTION_DATA_END_OFFSET = 0x0ff4;

type Gen3SectionFooter = {
    sectionId: number;
    checksum: number;
    saveIndex: number;
};

export type Gen3SaveSection = {
    sectionId: number;
    saveIndex: number;
    data: Buffer;
    raw: Buffer;
};

export type ReadGen3SaveSectionsResult = {
    activeSaveIndex: number;
    sectionsById: Map<number, Gen3SaveSection>;
};
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

const getActiveSaveIndex = (
    sectionsBySaveIndex: Map<number, Gen3SaveSection[]>
): number => {
    const saveIndexSummary = Array.from(sectionsBySaveIndex.entries()).map(
        ([saveIndex, sections]) => {
            return {
                saveIndex,
                count: sections.length,
                sectionIds: sections.map((section) => section.sectionId)
            };
        }
    );

    console.log("sectionsBySaveIndex summary", saveIndexSummary);

    const candidateSaveIndexes = Array.from(sectionsBySaveIndex.keys()).filter(
        (saveIndex) => {
            const sections = sectionsBySaveIndex.get(saveIndex);

            if (!sections) {
                return false;
            }

            return sections.length >= SECTION_COUNT;
        }
    );

    if (candidateSaveIndexes.length === 0) {
        throw new Error("No complete Gen 3 save slot found");
    }

    return Math.max(...candidateSaveIndexes);
};

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