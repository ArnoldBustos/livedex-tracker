import { SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER } from "../../../../../../packages/shared/src";
import type { SupportedGame } from "../../../../../../packages/shared/src";
import { logParseDebug } from "../../../lib/debugLog";
import {
    buildImportedDexSnapshot,
    type ImportedDexSnapshot
} from "../shared/buildImportedDexSnapshot";
import type { ExtractedPokedexFlags } from "../gen3/extractPokedexFlags";

export type Gen4Layout = "DIAMOND_PEARL" | "PLATINUM" | "HGSS";

type ParsedGen4Save = {
    detectedGame: SupportedGame | null;
    detectedLayout: Gen4Layout;
    trainerInfo: {
        name: string;
        gender: "male" | "female" | "unknown";
    };
    partyPokemon: [];
    boxPokemon: [];
    pokedexFlags: ExtractedPokedexFlags;
    importedDexSnapshot: ImportedDexSnapshot;
    debug: {
        activeGeneralBlockIndex: number;
        activeStorageBlockIndex: number;
        detectedLayout: Gen4Layout;
        detectedGameReason: string;
        hasNationalDex: boolean;
        seenNationalDexNumbers: number[];
        caughtNationalDexNumbers: number[];
        seenCount: number;
        caughtCount: number;
        partyCount: number;
        partySpeciesIds: number[];
        boxCount: number;
        boxSpeciesIds: number[];
        livingNationalDexNumbers: number[];
        livingCount: number;
        pokedexError: string | null;
        partyError: string | null;
        boxError: string | null;
    };
};

type Gen4LayoutCandidate = {
    layout: Gen4Layout;
    detectedGame: SupportedGame | null;
    generalSize: number;
    storageSize: number;
    generalOffset: number;
    storageOffset: number;
    footerSize: number;
};

const GEN4_SAVE_FILE_SIZE = 0x80000;
const GEN4_PARTITION_SIZE = 0x40000;

const GEN4_LAYOUT_CANDIDATES: Gen4LayoutCandidate[] = [
    {
        layout: "PLATINUM",
        detectedGame: "PLATINUM",
        generalSize: 0xcf2c,
        storageSize: 0x121e4,
        generalOffset: 0,
        storageOffset: 0xcf2c,
        footerSize: 0x14
    },
    {
        layout: "HGSS",
        detectedGame: null,
        generalSize: 0xf628,
        storageSize: 0x12310,
        generalOffset: 0,
        storageOffset: 0xf700,
        footerSize: 0x10
    },
    {
        layout: "DIAMOND_PEARL",
        detectedGame: null,
        generalSize: 0xc0ec,
        storageSize: 0x121e4,
        generalOffset: 0,
        storageOffset: 0xc0ec,
        footerSize: 0x14
    }
];

const emptyPokedexFlags: ExtractedPokedexFlags = {
    seenNationalDexNumbers: [],
    ownedNationalDexNumbers: [],
    hasNationalDex: false
};

const calculateCrc16Ccitt = (bytes: Buffer) => {
    let checksum = 0xffff;

    for (const byte of bytes) {
        checksum ^= byte << 8;

        for (let bitIndex = 0; bitIndex < 8; bitIndex += 1) {
            checksum = (checksum & 0x8000) !== 0
                ? (checksum << 1) ^ 0x1021
                : checksum << 1;
            checksum &= 0xffff;
        }
    }

    return checksum;
};

const getGen4BlockChecksumIsValid = ({
    fileBuffer,
    blockOffset,
    blockLength,
    partitionOffset,
    footerSize
}: {
    fileBuffer: Buffer;
    blockOffset: number;
    blockLength: number;
    partitionOffset: number;
    footerSize: number;
}) => {
    const absoluteBlockOffset = partitionOffset + blockOffset;
    const absoluteBlockEnd = absoluteBlockOffset + blockLength;

    if (absoluteBlockOffset < 0 || absoluteBlockEnd > fileBuffer.length) {
        return false;
    }

    const block = fileBuffer.subarray(absoluteBlockOffset, absoluteBlockEnd);
    const calculatedChecksum = calculateCrc16Ccitt(block.subarray(0, block.length - footerSize));
    const storedChecksum = block.readUInt16LE(block.length - 2);

    return calculatedChecksum === storedChecksum;
};

// readGen4BlockSaveCounter reads the footer counter PKHeX uses while choosing active Gen 4 save blocks.
const readGen4BlockSaveCounter = ({
    fileBuffer,
    blockOffset,
    blockLength,
    partitionOffset
}: {
    fileBuffer: Buffer;
    blockOffset: number;
    blockLength: number;
    partitionOffset: number;
}) => {
    const footerOffset = partitionOffset + blockOffset + blockLength - 0x14;

    if (footerOffset < 0 || footerOffset + 4 > fileBuffer.length) {
        return null;
    }

    return fileBuffer.readUInt32LE(footerOffset);
};

const getActiveBlockIndex = ({
    fileBuffer,
    blockOffset,
    blockLength,
    footerSize
}: {
    fileBuffer: Buffer;
    blockOffset: number;
    blockLength: number;
    footerSize: number;
}) => {
    const primarySaveCounter = readGen4BlockSaveCounter({
        fileBuffer,
        blockOffset,
        blockLength,
        partitionOffset: 0
    });
    const backupSaveCounter = readGen4BlockSaveCounter({
        fileBuffer,
        blockOffset,
        blockLength,
        partitionOffset: GEN4_PARTITION_SIZE
    });
    const primaryChecksumIsValid = getGen4BlockChecksumIsValid({
        fileBuffer,
        blockOffset,
        blockLength,
        partitionOffset: 0,
        footerSize
    });
    const backupChecksumIsValid = getGen4BlockChecksumIsValid({
        fileBuffer,
        blockOffset,
        blockLength,
        partitionOffset: GEN4_PARTITION_SIZE,
        footerSize
    });

    if (primarySaveCounter === null || backupSaveCounter === null) {
        return null;
    }

    if (!primaryChecksumIsValid && !backupChecksumIsValid) {
        return null;
    }

    if (primaryChecksumIsValid && !backupChecksumIsValid) {
        return 0;
    }

    if (!primaryChecksumIsValid && backupChecksumIsValid) {
        return 1;
    }

    return primarySaveCounter >= backupSaveCounter ? 0 : 1;
};

const detectGen4Layout = (fileBuffer: Buffer) => {
    for (const candidate of GEN4_LAYOUT_CANDIDATES) {
        const activeGeneralBlockIndex = getActiveBlockIndex({
            fileBuffer,
            blockOffset: candidate.generalOffset,
            blockLength: candidate.generalSize,
            footerSize: candidate.footerSize
        });
        const activeStorageBlockIndex = getActiveBlockIndex({
            fileBuffer,
            blockOffset: candidate.storageOffset,
            blockLength: candidate.storageSize,
            footerSize: candidate.footerSize
        });

        if (activeGeneralBlockIndex === null || activeStorageBlockIndex === null) {
            continue;
        }

        return {
            ...candidate,
            activeGeneralBlockIndex,
            activeStorageBlockIndex,
            detectionReason: `${candidate.layout} block footers were readable in both save partitions`
        };
    }

    throw new Error("Unsupported Gen 4 save layout");
};

export const parseGen4Save = (fileBuffer: Buffer): never => {
    if (fileBuffer.length !== GEN4_SAVE_FILE_SIZE) {
        throw new Error(`Unsupported Gen 4 save size: ${fileBuffer.length}`);
    }

    const detectedLayoutResult = detectGen4Layout(fileBuffer);
    const importedDexSnapshot = buildImportedDexSnapshot({
        pokedexFlags: emptyPokedexFlags,
        partyPokemon: [],
        boxPokemon: [],
        maxNationalDexNumber: SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER
    });

    logParseDebug("parseGen4Save detected layout", detectedLayoutResult);

    throw new Error(
        `Gen 4 save detected as ${detectedLayoutResult.layout}, but Gen 4 party/box extraction is not implemented yet`
    );

};
