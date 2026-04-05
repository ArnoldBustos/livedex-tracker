// DexProgressInput defines the count inputs for one scoped dex progress calculation.
// dashboard summary components pass their already-filtered totals into this pure utility.
export type DexProgressInput = {
    total: number;
    seen: number;
    caught: number;
    living: number;
};

// DexProgressResult defines the rounded percentage outputs for one scoped dex view.
// dashboard summary components read this result to render progress labels without duplicating math.
export type DexProgressResult = {
    seenPercent: number;
    caughtPercent: number;
    livingPercent: number;
};

// getRoundedDexPercent converts one scoped dex count into a percentage with one-decimal precision.
// computeDexProgress uses this so small non-zero progress values do not disappear into 0%.
const getRoundedDexPercent = (count: number, total: number) => {
    return Number(((count / total) * 100).toFixed(1));
};

// computeDexProgress converts scoped dex counts into rounded percentage values.
// dashboard summary UI uses this so percentage logic stays modular and reusable outside components.
export const computeDexProgress = ({
    total,
    seen,
    caught,
    living
}: DexProgressInput): DexProgressResult => {
    if (total === 0) {
        return {
            seenPercent: 0,
            caughtPercent: 0,
            livingPercent: 0
        };
    }

    return {
        seenPercent: getRoundedDexPercent(seen, total),
        caughtPercent: getRoundedDexPercent(caught, total),
        livingPercent: getRoundedDexPercent(living, total)
    };
};
