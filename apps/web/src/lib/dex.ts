import { getRegionalDexNumbersForGame } from "../../../../packages/shared/src";
import type { DexEntry, DexScope, SupportedGame } from "../types/save";

export const getDexEntriesForScope = ({
    entries,
    scope,
    game
}: {
    entries: DexEntry[];
    scope: DexScope;
    game: SupportedGame | null | undefined;
}) => {
    if (scope === "national") {
        return entries;
    }

    const regionalDexNumbers = getRegionalDexNumbersForGame(game);

    if (!regionalDexNumbers) {
        return entries;
    }

    const regionalDexOrderByNationalDexNumber = new Map(
        regionalDexNumbers.map((nationalDexNumber, index) => {
            return [nationalDexNumber, index];
        })
    );

    return entries
        .filter((dexEntry) => {
            return regionalDexOrderByNationalDexNumber.has(dexEntry.dexNumber);
        })
        .sort((leftDexEntry, rightDexEntry) => {
            return (
                (regionalDexOrderByNationalDexNumber.get(leftDexEntry.dexNumber) ?? Number.MAX_SAFE_INTEGER) -
                (regionalDexOrderByNationalDexNumber.get(rightDexEntry.dexNumber) ?? Number.MAX_SAFE_INTEGER)
            );
        });
};
