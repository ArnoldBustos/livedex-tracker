import {
    GEN3_MAX_NATIONAL_DEX_NUMBER,
    SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER
} from "../../../../packages/shared/src";
import { pokemonSpeciesSeedData } from "../data/pokemonSpecies";
import { pokemonSpeciesIntroducedGen1SeedData } from "../data/pokemonSpeciesIntroducedGen1";
import { pokemonSpeciesIntroducedGen2SeedData } from "../data/pokemonSpeciesIntroducedGen2";
import { pokemonSpeciesIntroducedGen3SeedData } from "../data/pokemonSpeciesIntroducedGen3";
import { pokemonSpeciesIntroducedGen4SeedData } from "../data/pokemonSpeciesIntroducedGen4";
import type { PokemonSpeciesSeed } from "../data/pokemonSpecies";

// SpeciesModuleDefinition stores one introduced-generation module plus the expected National Dex range it owns.
// validatePokemonSpeciesCatalog uses these definitions so range and overlap checks stay modular.
type SpeciesModuleDefinition = {
    label: string;
    species: PokemonSpeciesSeed[];
    expectedStartDexNumber: number;
    expectedEndDexNumber: number;
};

// introducedSpeciesModules lists the introduction-only modules and their expected National Dex ownership ranges.
// The validator iterates this list so future generation additions only need one new module definition.
const introducedSpeciesModules: SpeciesModuleDefinition[] = [
    {
        label: "Gen 1 introduced species",
        species: pokemonSpeciesIntroducedGen1SeedData,
        expectedStartDexNumber: 1,
        expectedEndDexNumber: 151
    },
    {
        label: "Gen 2 introduced species",
        species: pokemonSpeciesIntroducedGen2SeedData,
        expectedStartDexNumber: 152,
        expectedEndDexNumber: 251
    },
    {
        label: "Gen 3 introduced species",
        species: pokemonSpeciesIntroducedGen3SeedData,
        expectedStartDexNumber: 252,
        expectedEndDexNumber: GEN3_MAX_NATIONAL_DEX_NUMBER
    },
    {
        label: "Gen 4 introduced species",
        species: pokemonSpeciesIntroducedGen4SeedData,
        expectedStartDexNumber: GEN3_MAX_NATIONAL_DEX_NUMBER + 1,
        expectedEndDexNumber: SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER
    }
];

// throwValidationError raises a consistent invariant failure with validator context for CLI output.
// All helper checks call this so failures stay short and easy to diagnose.
const throwValidationError = (message: string): never => {
    throw new Error(`Pokemon species catalog validation failed: ${message}`);
};

// getDexNumbers projects one species module into its National Dex numbers for range and duplicate checks.
// The module-level and catalog-level validators both use this shared projection.
const getDexNumbers = (species: PokemonSpeciesSeed[]): number[] => {
    return species.map((pokemonSpecies) => {
        return pokemonSpecies.dexNumber;
    });
};

// getDuplicateDexNumbers finds repeated National Dex numbers inside one list so overlap bugs fail clearly.
// Module validation and catalog validation both use this to enforce uniqueness.
const getDuplicateDexNumbers = (dexNumbers: number[]): number[] => {
    const seenDexNumbers = new Set<number>();
    const duplicateDexNumbers = new Set<number>();

    for (const dexNumber of dexNumbers) {
        if (seenDexNumbers.has(dexNumber)) {
            duplicateDexNumbers.add(dexNumber);
            continue;
        }

        seenDexNumbers.add(dexNumber);
    }

    return Array.from(duplicateDexNumbers).sort((leftDexNumber, rightDexNumber) => {
        return leftDexNumber - rightDexNumber;
    });
};

// getMissingDexNumbers finds gaps inside an expected inclusive National Dex range for one module or catalog.
// Range validators use this to prove each owned span is complete with no skipped species numbers.
const getMissingDexNumbers = ({
    dexNumbers,
    expectedStartDexNumber,
    expectedEndDexNumber
}: {
    dexNumbers: number[];
    expectedStartDexNumber: number;
    expectedEndDexNumber: number;
}): number[] => {
    const dexNumberSet = new Set(dexNumbers);
    const missingDexNumbers: number[] = [];

    for (
        let dexNumber = expectedStartDexNumber;
        dexNumber <= expectedEndDexNumber;
        dexNumber += 1
    ) {
        if (!dexNumberSet.has(dexNumber)) {
            missingDexNumbers.push(dexNumber);
        }
    }

    return missingDexNumbers;
};

// getOutOfRangeDexNumbers finds species numbers that fall outside the expected inclusive ownership range.
// Module validation uses this to prevent cumulative generation files from creeping back in.
const getOutOfRangeDexNumbers = ({
    dexNumbers,
    expectedStartDexNumber,
    expectedEndDexNumber
}: {
    dexNumbers: number[];
    expectedStartDexNumber: number;
    expectedEndDexNumber: number;
}): number[] => {
    return dexNumbers.filter((dexNumber) => {
        return dexNumber < expectedStartDexNumber || dexNumber > expectedEndDexNumber;
    });
};

// formatDexNumberList renders failing National Dex numbers in a short CLI-friendly string.
// Validation errors use this so the exact broken values are visible without extra debugging.
const formatDexNumberList = (dexNumbers: number[]): string => {
    return dexNumbers.join(", ");
};

// validateIntroducedSpeciesModule enforces one introduced-generation module's internal range and uniqueness rules.
// The top-level validator calls this for each generation-owned module before checking cross-module composition.
const validateIntroducedSpeciesModule = (speciesModule: SpeciesModuleDefinition): void => {
    const dexNumbers = getDexNumbers(speciesModule.species);
    const duplicateDexNumbers = getDuplicateDexNumbers(dexNumbers);

    if (duplicateDexNumbers.length > 0) {
        throwValidationError(
            `${speciesModule.label} contains duplicate National Dex numbers: ${formatDexNumberList(duplicateDexNumbers)}`
        );
    }

    const missingDexNumbers = getMissingDexNumbers({
        dexNumbers,
        expectedStartDexNumber: speciesModule.expectedStartDexNumber,
        expectedEndDexNumber: speciesModule.expectedEndDexNumber
    });

    if (missingDexNumbers.length > 0) {
        throwValidationError(
            `${speciesModule.label} is missing National Dex numbers: ${formatDexNumberList(missingDexNumbers)}`
        );
    }

    const outOfRangeDexNumbers = getOutOfRangeDexNumbers({
        dexNumbers,
        expectedStartDexNumber: speciesModule.expectedStartDexNumber,
        expectedEndDexNumber: speciesModule.expectedEndDexNumber
    });

    if (outOfRangeDexNumbers.length > 0) {
        throwValidationError(
            `${speciesModule.label} contains out-of-range National Dex numbers: ${formatDexNumberList(outOfRangeDexNumbers)}`
        );
    }
}

// validateNoCrossModuleDuplicates enforces that one National Dex number belongs to only one introduced-generation file.
// The catalog split relies on this to keep generation files introduction-only instead of cumulative.
const validateNoCrossModuleDuplicates = (speciesModules: SpeciesModuleDefinition[]): void => {
    const ownerByDexNumber = new Map<number, string>();

    for (const speciesModule of speciesModules) {
        for (const dexNumber of getDexNumbers(speciesModule.species)) {
            const existingOwner = ownerByDexNumber.get(dexNumber);

            if (existingOwner) {
                throwValidationError(
                    `National Dex number ${dexNumber} appears in both ${existingOwner} and ${speciesModule.label}`
                );
            }

            ownerByDexNumber.set(dexNumber, speciesModule.label);
        }
    }
};

// validateComposedCatalog enforces that the composed seed catalog is the single complete `1..max` canonical list.
// pokemonSpeciesCatalog.ts connects here because it is the only module allowed to assemble the full dataset.
const validateComposedCatalog = (speciesCatalog: PokemonSpeciesSeed[]): void => {
    const dexNumbers = getDexNumbers(speciesCatalog);
    const duplicateDexNumbers = getDuplicateDexNumbers(dexNumbers);

    if (duplicateDexNumbers.length > 0) {
        throwValidationError(
            `Composed species catalog contains duplicate National Dex numbers: ${formatDexNumberList(duplicateDexNumbers)}`
        );
    }

    if (speciesCatalog.length !== SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER) {
        throwValidationError(
            `Composed species catalog count ${speciesCatalog.length} does not match supported dex cap ${SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER}`
        );
    }

    const missingDexNumbers = getMissingDexNumbers({
        dexNumbers,
        expectedStartDexNumber: 1,
        expectedEndDexNumber: SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER
    });

    if (missingDexNumbers.length > 0) {
        throwValidationError(
            `Composed species catalog is missing National Dex numbers: ${formatDexNumberList(missingDexNumbers)}`
        );
    }

    const outOfRangeDexNumbers = getOutOfRangeDexNumbers({
        dexNumbers,
        expectedStartDexNumber: 1,
        expectedEndDexNumber: SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER
    });

    if (outOfRangeDexNumbers.length > 0) {
        throwValidationError(
            `Composed species catalog contains out-of-range National Dex numbers: ${formatDexNumberList(outOfRangeDexNumbers)}`
        );
    }
};

// validatePokemonSpeciesCatalog runs all introduced-generation and composed-catalog invariants for CLI validation.
// The package.json validate:species script executes this entrypoint before seed or catalog refactors land.
const validatePokemonSpeciesCatalog = (): void => {
    for (const speciesModule of introducedSpeciesModules) {
        validateIntroducedSpeciesModule(speciesModule);
    }

    validateNoCrossModuleDuplicates(introducedSpeciesModules);
    validateComposedCatalog(pokemonSpeciesSeedData);

    console.log(
        `Pokemon species catalog validation passed for National Dex 1-${SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER}.`
    );
};

validatePokemonSpeciesCatalog();
