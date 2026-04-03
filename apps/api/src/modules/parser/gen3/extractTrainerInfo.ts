import type { Gen3SaveSection } from "./readGen3SaveSections";

type ExtractTrainerInfoParams = {
    sectionsById: Map<number, Gen3SaveSection>;
};

export type ExtractedTrainerInfo = {
    name: string;
    gender: "male" | "female" | "unknown";
};

const TRAINER_INFO_SECTION_ID = 0;
const TRAINER_NAME_OFFSET = 0x0000;
const TRAINER_NAME_LENGTH = 7;
const TRAINER_GENDER_OFFSET = 0x0008;

const decodeGen3TrainerName = (nameBuffer: Buffer): string => {
    const decodedCharacters: string[] = [];

    for (let characterIndex = 0; characterIndex < nameBuffer.length; characterIndex += 1) {
        const characterValue = nameBuffer[characterIndex];

        if (characterValue === 0xff) {
            break;
        }

        if (characterValue >= 0xbb && characterValue <= 0xd4) {
            decodedCharacters.push(String.fromCharCode(65 + (characterValue - 0xbb)));
            continue;
        }

        if (characterValue >= 0xd5 && characterValue <= 0xee) {
            decodedCharacters.push(String.fromCharCode(97 + (characterValue - 0xd5)));
            continue;
        }

        if (characterValue >= 0xa1 && characterValue <= 0xaa) {
            decodedCharacters.push(String.fromCharCode(48 + (characterValue - 0xa1)));
            continue;
        }

        if (characterValue === 0x00) {
            decodedCharacters.push(" ");
            continue;
        }

        decodedCharacters.push("?");
    }

    return decodedCharacters.join("").trim() || "Unknown";
};

export const extractTrainerInfo = ({
    sectionsById
}: ExtractTrainerInfoParams): ExtractedTrainerInfo => {
    const trainerSection = sectionsById.get(TRAINER_INFO_SECTION_ID);

    if (!trainerSection) {
        throw new Error("Trainer info section 0 was not found");
    }

    const trainerNameBuffer = trainerSection.data.subarray(
        TRAINER_NAME_OFFSET,
        TRAINER_NAME_OFFSET + TRAINER_NAME_LENGTH
    );

    const trainerGenderValue = trainerSection.data.readUInt8(TRAINER_GENDER_OFFSET);

    let gender: "male" | "female" | "unknown" = "unknown";

    if (trainerGenderValue === 0) {
        gender = "male";
    } else if (trainerGenderValue === 1) {
        gender = "female";
    }

    const name = decodeGen3TrainerName(trainerNameBuffer);

    console.log("extractTrainerInfo result", {
        name,
        trainerGenderValue,
        gender
    });

    return {
        name,
        gender
    };
};