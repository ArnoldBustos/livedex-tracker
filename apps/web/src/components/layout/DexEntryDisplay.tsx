import type {
    DexCollectionLayerKey,
    DexDisplayStatus,
    DexEntry,
    DexGridDensity,
    DexListDensity,
    DexViewMode
} from "../../types/save";
import { getPokemonTypeBadgeStyle } from "../../lib/pokemonTypeStyles";
import shinyStarIcon from "../../assets/shiny-star.png";

// DexEntryDisplayProps stores the already-filtered dashboard entries, focus state, and Select Mode staging state.
// LoadedDashboardView passes this in so grid and list rendering can branch without duplicating filter or staged-owned logic.
type DexEntryDisplayProps = {
    entries: DexEntry[];
    selectedDexEntry: DexEntry | null;
    selectedCollectionLayer: DexCollectionLayerKey;
    selectedGridDensity: DexGridDensity;
    selectedListDensity: DexListDensity;
    selectedViewMode: DexViewMode;
    isSelectModeActive: boolean;
    pendingOwnedEntryIds: number[];
    onPressDexEntry: (dexEntry: DexEntry) => void;
};

// getDexEntryStatus returns the strongest collection state for one dex layer on one dex entry.
// DexEntryDisplay uses this so both the grid cards and list rows stay aligned with the shared dashboard filter logic.
const getDexEntryStatus = (
    dexEntry: DexEntry,
    layerKey: DexCollectionLayerKey = "standard"
): DexDisplayStatus => {
    const collectionState = dexEntry[layerKey];

    if (collectionState.hasLivingEntry) {
        return "living";
    }

    if (collectionState.caught) {
        return "caught";
    }

    if (collectionState.seen) {
        return "seen";
    }

    return "missing";
};

// getDexEntryStatusLabel formats one status value into the badge copy shown in the dex display.
// DexEntryDisplay uses this so grid and list rows present the same wording for each collection state.
const getDexEntryStatusLabel = (status: DexDisplayStatus) => {
    if (status === "living") {
        return "Living";
    }

    if (status === "caught") {
        return "Caught";
    }

    if (status === "seen") {
        return "Seen";
    }

    return "Missing";
};

// getDexEntryStatusBadgeClassName maps one status to the shared badge treatment used by grid cards.
// DexEntryDisplay uses this so the grid keeps the same color language for dex progress.
const getDexEntryStatusBadgeClassName = (status: DexDisplayStatus) => {
    if (status === "living") {
        return "rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold uppercase text-green-700";
    }

    if (status === "caught") {
        return "rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold uppercase text-yellow-700";
    }

    if (status === "seen") {
        return "rounded-full bg-purple-100 px-2 py-1 text-[10px] font-bold uppercase text-purple-700";
    }

    return "rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase text-gray-500";
};

// getDexListStatusBadgeClassName maps list density and status to tighter list-row pills.
// ListDexEntryDisplay uses this so compact rows can reduce pill height and padding without affecting the grid cards.
const getDexListStatusBadgeClassName = ({
    status,
    selectedListDensity
}: {
    status: DexDisplayStatus;
    selectedListDensity: DexListDensity;
}) => {
    const baseClassName = status === "living"
        ? "bg-green-100 text-green-700"
        : status === "caught"
            ? "bg-yellow-100 text-yellow-700"
            : status === "seen"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-500";

    if (selectedListDensity === "comfortable") {
        return `rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${baseClassName}`;
    }

    if (selectedListDensity === "compact") {
        return `rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${baseClassName}`;
    }

    return `rounded-full px-2 py-0.75 text-[10px] font-bold uppercase ${baseClassName}`;
};

// getHasShinyCardIndicator decides whether one dex entry should show the display-only shiny marker.
// DexEntryDisplay uses this in both layouts so shiny presence remains visible without changing edit behavior.
const getHasShinyCardIndicator = (dexEntry: DexEntry) => {
    return dexEntry.shiny.caught || dexEntry.shiny.hasLivingEntry;
};

// getIsDexEntryPendingOwnedSelection returns whether one species currently has a staged owned update.
// DexEntryDisplay uses this so Select Mode can add the temporary green checkmark badge without changing live status badges.
const getIsDexEntryPendingOwnedSelection = ({
    dexEntry,
    pendingOwnedEntryIds
}: {
    dexEntry: DexEntry;
    pendingOwnedEntryIds: number[];
}) => {
    return pendingOwnedEntryIds.includes(dexEntry.pokemonSpeciesId);
};

// getSelectModeBadgeClassName returns the shared green checkmark badge treatment for staged owned entries.
// DexEntryDisplay uses this so grid cards and list rows present one coherent Select Mode indicator.
const getSelectModeBadgeClassName = (indicatorLocation: "grid" | "list") => {
    if (indicatorLocation === "list") {
        return "absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-sm font-extrabold text-white shadow-md";
    }

    return "absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-sm font-extrabold text-white shadow-md";
};

// SelectModeCheckmarkBadge renders the staged-owned green badge used in grid and list layouts.
// DexEntryDisplay uses this so Select Mode keeps one consistent phone-gallery style indicator without non-ASCII text.
const SelectModeCheckmarkBadge = ({
    indicatorLocation
}: {
    indicatorLocation: "grid" | "list";
}) => {
    return (
        <span
            className={getSelectModeBadgeClassName(indicatorLocation)}
            aria-label="Staged to be marked owned"
        >
            <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
            >
                <path
                    d="M3.5 8.5L6.5 11.5L12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
};

// getShinyIndicatorClassName maps shiny marker context to stronger contrast styles.
// DexEntryDisplay uses this so the shiny marker stays legible on both compact cards and list rows.
const getShinyIndicatorClassName = (indicatorLocation: "card" | "list") => {
    if (indicatorLocation === "list") {
        return "inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200 shadow-sm";
    }

    return "inline-flex items-center justify-center rounded-full border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200 shadow-sm";
};

// getDexGridSectionClassName maps density to explicit guest and signed-in column counts.
// DexEntryDisplay uses this so each density step changes the visible card count predictably with no duplicate density stages.
const getDexGridSectionClassName = (selectedGridDensity: DexGridDensity) => {
    if (selectedGridDensity === "extraComfortable") {
        return "grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4";
    }

    if (selectedGridDensity === "comfortable") {
        return "grid grid-cols-3 gap-4 md:grid-cols-4 xl:grid-cols-5";
    }

    if (selectedGridDensity === "default") {
        return "grid grid-cols-4 gap-3 md:grid-cols-5 xl:grid-cols-6";
    }

    if (selectedGridDensity === "compact") {
        return "grid grid-cols-5 gap-3 md:grid-cols-6 xl:grid-cols-7";
    }

    return "grid grid-cols-6 gap-2 md:grid-cols-7 xl:grid-cols-8";
};

// getDexCardImageClassName chooses sprite sizing for the active density option.
// DexEntryDisplay uses this so compact and comfortable cards scale consistently with the grid.
const getDexCardImageClassName = (selectedGridDensity: DexGridDensity) => {
    if (selectedGridDensity === "extraComfortable") {
        return "max-h-[88px] max-w-[88px] object-contain";
    }

    if (selectedGridDensity === "comfortable") {
        return "max-h-[80px] max-w-[80px] object-contain";
    }

    if (selectedGridDensity === "extraCompact") {
        return "max-h-[56px] max-w-[56px] object-contain";
    }

    if (selectedGridDensity === "compact") {
        return "max-h-[64px] max-w-[64px] object-contain";
    }

    return "max-h-[72px] max-w-[72px] object-contain";
};

// getPokemonSpriteUrl builds the Home sprite URL for one dex card.
// DexEntryDisplay uses this so grid cards can render the same sprite source as before.
const getPokemonSpriteUrl = (dexNumber: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${dexNumber}.png`;
};

// getDexEntryImageToneClassName returns the artwork tone classes for one dex status.
// DexEntryDisplay uses this so missing entries stay visible but darker than seen or owned entries.
const getDexEntryImageToneClassName = (status: DexDisplayStatus) => {
    if (status === "missing") {
        return "opacity-55 brightness-75 saturate-0";
    }

    return "";
};

// formatPokemonTypeLabel converts API casing into the badge label casing shown on cards.
// DexEntryDisplay uses this so type pills render consistent readable labels.
const formatPokemonTypeLabel = (pokemonType: string) => {
    return `${pokemonType.charAt(0)}${pokemonType.slice(1).toLowerCase()}`;
};

// getDexListSectionClassName returns the shared list container classes for the row-based dex view.
// DexEntryDisplay uses this so row styling and the sticky header can share one stable outer shell.
const getDexListSectionClassName = () => {
    return "rounded-2xl border border-[rgba(130,129,111,0.18)] bg-white shadow-sm";
};

// getDexListHeaderClassName maps list density to the desktop header spacing and sticky treatment above list rows.
// ListDexEntryDisplay uses this so compact mode visibly fits more rows while the column header stays visible on scroll.
const getDexListHeaderClassName = (selectedListDensity: DexListDensity) => {
    if (selectedListDensity === "comfortable") {
        return "sticky top-4 z-10 hidden grid-cols-[82px_minmax(0,1.3fr)_112px_64px_104px] items-center gap-4 border-b border-gray-200 bg-[rgba(249,250,251,0.96)] px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500 backdrop-blur-sm md:grid";
    }

    if (selectedListDensity === "compact") {
        return "sticky top-4 z-10 hidden grid-cols-[76px_minmax(0,1.3fr)_96px_56px_88px] items-center gap-1.5 border-b border-gray-200 bg-[rgba(249,250,251,0.96)] px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-gray-500 backdrop-blur-sm md:grid";
    }

    return "sticky top-4 z-10 hidden grid-cols-[80px_minmax(0,1.3fr)_104px_60px_96px] items-center gap-2.5 border-b border-gray-200 bg-[rgba(249,250,251,0.96)] px-3.5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-500 backdrop-blur-sm md:grid";
};

// getDexListRowClassName maps list density plus focus and staged-owned state to row spacing and emphasis.
// ListDexEntryDisplay uses this so rows can distinguish the detail focus state from the temporary Select Mode state.
const getDexListRowClassName = ({
    selectedListDensity,
    isSelected,
    isPendingOwnedSelection
}: {
    selectedListDensity: DexListDensity;
    isSelected: boolean;
    isPendingOwnedSelection: boolean;
}) => {
    const selectionClassName = isPendingOwnedSelection
        ? "border-l-4 border-r-4 border-emerald-500 bg-[linear-gradient(90deg,rgba(16,185,129,0.2)_0%,rgba(236,253,245,1)_20%,rgba(255,255,255,1)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_1px_rgba(16,185,129,0.18)] hover:bg-[linear-gradient(90deg,rgba(16,185,129,0.24)_0%,rgba(236,253,245,1)_24%,rgba(255,255,255,1)_100%)]"
        : isSelected
            ? "border-l-4 border-r-4 border-emerald-500 bg-[linear-gradient(90deg,rgba(16,185,129,0.14)_0%,rgba(236,253,245,0.98)_18%,rgba(255,255,255,1)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_1px_rgba(16,185,129,0.12)] hover:bg-[linear-gradient(90deg,rgba(16,185,129,0.18)_0%,rgba(236,253,245,1)_22%,rgba(255,255,255,1)_100%)]"
            : "border-l-4 border-r-4 border-transparent bg-white hover:bg-[linear-gradient(90deg,rgba(243,244,246,0.95)_0%,rgba(255,255,255,1)_18%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]";

    if (selectedListDensity === "comfortable") {
        return `relative grid w-full grid-cols-1 gap-3.5 px-5 py-3.5 pr-14 text-left transition-colors transition-shadow duration-150 ${selectionClassName} md:grid-cols-[82px_minmax(0,1.3fr)_112px_64px_104px] md:items-center`;
    }

    if (selectedListDensity === "compact") {
        return `relative grid w-full grid-cols-1 gap-1.5 px-2.5 py-1.5 pr-12 text-left transition-colors transition-shadow duration-150 ${selectionClassName} md:grid-cols-[76px_minmax(0,1.3fr)_96px_56px_88px] md:items-center`;
    }

    return `relative grid w-full grid-cols-1 gap-2.5 px-3.5 py-2.5 pr-14 text-left transition-colors transition-shadow duration-150 ${selectionClassName} md:grid-cols-[80px_minmax(0,1.3fr)_104px_60px_96px] md:items-center`;
};

// getDexListPokemonNameWrapperClassName maps row selection to the subtle title emphasis used in the list.
// ListDexEntryDisplay uses this so the active row reads as the current focus before the user looks to the detail panel.
const getDexListPokemonNameWrapperClassName = (isSelected: boolean) => {
    if (isSelected) {
        return "truncate text-emerald-900";
    }

    return "truncate text-gray-900";
};

// getDexListDexNumberClassName maps list density to the dex-number text size used in each row.
// ListDexEntryDisplay uses this so support text tightens before row content is reduced.
const getDexListDexNumberClassName = (selectedListDensity: DexListDensity) => {
    if (selectedListDensity === "comfortable") {
        return "text-sm font-extrabold tracking-[0.02em] text-gray-500";
    }

    if (selectedListDensity === "compact") {
        return "text-xs font-extrabold tracking-[0.02em] text-gray-500";
    }

    return "text-sm font-extrabold tracking-[0.02em] text-gray-500 md:text-xs";
};

// getDexListPokemonNameClassName maps list density to the primary name text size in one row.
// ListDexEntryDisplay uses this so comfortable rows feel roomier while compact rows stay scan-friendly.
const getDexListPokemonNameClassName = (selectedListDensity: DexListDensity) => {
    if (selectedListDensity === "comfortable") {
        return "truncate text-base font-extrabold text-gray-900";
    }

    if (selectedListDensity === "compact") {
        return "truncate text-[13px] font-extrabold text-gray-900";
    }

    return "truncate text-sm font-extrabold text-gray-900";
};

// getDexListOwnershipGroupClassName maps list density to the compact owned-summary wrapper.
// ListDexEntryDisplay uses this so owned counters stay legible while using less vertical space per row.
const getDexListOwnershipGroupClassName = (selectedListDensity: DexListDensity) => {
    if (selectedListDensity === "comfortable") {
        return "grid grid-cols-2 gap-2.5 md:flex md:flex-col md:gap-1";
    }

    if (selectedListDensity === "compact") {
        return "grid grid-cols-2 gap-1 md:flex md:flex-col md:gap-0.5";
    }

    return "grid grid-cols-2 gap-1.5 md:flex md:flex-col md:gap-0.75";
};

// getDexListOwnershipMetricClassName maps list density and counter type to the compact owned metric chip.
// ListDexEntryDisplay uses this so owned values can be shown inline with short labels instead of tall repeated blocks.
const getDexListOwnershipMetricClassName = ({
    selectedListDensity,
    isShiny
}: {
    selectedListDensity: DexListDensity;
    isShiny: boolean;
}) => {
    const baseClassName = isShiny
        ? "rounded-md bg-amber-50 text-amber-700 md:bg-transparent"
        : "rounded-md bg-gray-50 text-gray-700 md:bg-transparent";

    if (selectedListDensity === "comfortable") {
        return `${baseClassName} flex items-center justify-between gap-2 px-2.5 py-2 md:px-0 md:py-0`;
    }

    if (selectedListDensity === "compact") {
        return `${baseClassName} flex items-center justify-between gap-1.5 px-1.5 py-1 md:px-0 md:py-0`;
    }

    return `${baseClassName} flex items-center justify-between gap-2 px-2 py-1.5 md:px-0 md:py-0`;
};

// getDexListOwnershipMetricLabelClassName maps list density and counter type to the short owned labels.
// ListDexEntryDisplay uses this so mobile rows stay clear while desktop rows avoid repeating verbose headers.
const getDexListOwnershipMetricLabelClassName = ({
    selectedListDensity,
    isShiny
}: {
    selectedListDensity: DexListDensity;
    isShiny: boolean;
}) => {
    const colorClassName = isShiny ? "text-amber-600" : "text-gray-400";

    if (selectedListDensity === "comfortable") {
        return `text-[10px] font-bold uppercase tracking-[0.08em] ${colorClassName} md:text-[9px]`;
    }

    if (selectedListDensity === "compact") {
        return `text-[9px] font-bold uppercase tracking-[0.06em] ${colorClassName}`;
    }

    return `text-[9px] font-bold uppercase tracking-[0.08em] ${colorClassName}`;
};

// getDexListOwnershipMetricValueClassName maps list density and counter type to the numeric owned values.
// ListDexEntryDisplay uses this so compact mode can reduce emphasis while keeping counts readable.
const getDexListOwnershipMetricValueClassName = ({
    selectedListDensity,
    isShiny
}: {
    selectedListDensity: DexListDensity;
    isShiny: boolean;
}) => {
    const colorClassName = isShiny ? "text-amber-700" : "text-gray-900";

    if (selectedListDensity === "comfortable") {
        return `text-sm font-extrabold ${colorClassName}`;
    }

    if (selectedListDensity === "compact") {
        return `text-xs font-extrabold ${colorClassName}`;
    }

    return `text-sm font-extrabold ${colorClassName}`;
};

// GridDexEntryDisplay renders the existing card layout for the filtered dex entries.
// DexEntryDisplay uses this branch when the dashboard stays in the default grid view.
const GridDexEntryDisplay = ({
    entries,
    selectedDexEntry,
    selectedCollectionLayer,
    selectedGridDensity,
    isSelectModeActive,
    pendingOwnedEntryIds,
    onPressDexEntry
}: Omit<DexEntryDisplayProps, "selectedListDensity" | "selectedViewMode">) => {
    return (
        <section className={getDexGridSectionClassName(selectedGridDensity)}>
            {entries.map((dexEntry) => {
                const status = getDexEntryStatus(dexEntry, selectedCollectionLayer);
                const hasShinyCardIndicator = getHasShinyCardIndicator(dexEntry);
                const imageToneClassName = getDexEntryImageToneClassName(status);
                const isPendingOwnedSelection = getIsDexEntryPendingOwnedSelection({
                    dexEntry,
                    pendingOwnedEntryIds
                });
                const isSelected = selectedDexEntry
                    ? selectedDexEntry.dexNumber === dexEntry.dexNumber
                    : false;

                return (
                    <button
                        key={dexEntry.dexNumber}
                        className={
                            isPendingOwnedSelection
                                ? "relative flex flex-col rounded-xl border-2 border-emerald-500 bg-[linear-gradient(180deg,rgba(236,253,245,0.95)_0%,rgba(255,255,255,1)_38%)] p-3 shadow-sm"
                                : isSelected
                                    ? "relative flex flex-col rounded-xl border-2 border-green-500 bg-white p-3 shadow-sm"
                                    : "relative flex flex-col rounded-xl bg-white p-3 shadow-sm hover:shadow-md"
                        }
                        type="button"
                        onClick={() => {
                            onPressDexEntry(dexEntry);
                        }}
                    >
                        {isSelectModeActive && isPendingOwnedSelection ? (
                            <SelectModeCheckmarkBadge indicatorLocation="grid" />
                        ) : null}

                        <div className="mb-2 flex items-start justify-between gap-2">
                            <span className="text-[10px] font-extrabold tracking-[0.04em] text-gray-400">
                                #{dexEntry.dexNumber.toString().padStart(3, "0")}
                            </span>

                            <span className={getDexEntryStatusBadgeClassName(status)}>
                                {getDexEntryStatusLabel(status)}
                            </span>
                        </div>

                        <div className="flex h-[88px] items-center justify-center overflow-hidden">
                            <img
                                src={getPokemonSpriteUrl(dexEntry.dexNumber)}
                                alt={dexEntry.name}
                                className={`${getDexCardImageClassName(selectedGridDensity)} ${imageToneClassName}`.trim()}
                            />
                        </div>

                        <div className="mt-2 min-w-0 text-sm font-extrabold tracking-[0.01em] text-gray-900">
                            <div className="truncate">
                                {dexEntry.name}
                            </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1">
                            {hasShinyCardIndicator ? (
                                <span className={`${getShinyIndicatorClassName("card")} h-6 w-6`}>
                                    <img
                                        src={shinyStarIcon}
                                        alt="Shiny collected"
                                        className="h-4 w-4 shrink-0 opacity-100 drop-shadow-[0_1px_1px_rgba(120,53,15,0.2)]"
                                    />
                                </span>
                            ) : null}

                            <span
                                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${getPokemonTypeBadgeStyle(dexEntry.primaryType).containerClassName}`}
                            >
                                {formatPokemonTypeLabel(dexEntry.primaryType)}
                            </span>

                            {dexEntry.secondaryType ? (
                                <span
                                    className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${getPokemonTypeBadgeStyle(dexEntry.secondaryType).containerClassName}`}
                                >
                                    {formatPokemonTypeLabel(dexEntry.secondaryType)}
                                </span>
                            ) : null}
                        </div>
                    </button>
                );
            })}
        </section>
    );
};

// ListDexEntryDisplay renders the dense row-based dex layout for faster scanning.
// DexEntryDisplay uses this branch when the dashboard switches from cards to the new list mode.
const ListDexEntryDisplay = ({
    entries,
    selectedDexEntry,
    selectedCollectionLayer,
    selectedListDensity,
    isSelectModeActive,
    pendingOwnedEntryIds,
    onPressDexEntry
}: Omit<DexEntryDisplayProps, "selectedGridDensity" | "selectedViewMode">) => {
    return (
        <section className={getDexListSectionClassName()}>
            <div className={getDexListHeaderClassName(selectedListDensity)}>
                <span>Dex No.</span>
                <span>Pokémon</span>
                <span>Status</span>
                <span>Shiny</span>
                <span>Owned</span>
            </div>

            <div className="divide-y divide-gray-100">
                {entries.map((dexEntry) => {
                    const status = getDexEntryStatus(dexEntry, selectedCollectionLayer);
                    const hasShinyCardIndicator = getHasShinyCardIndicator(dexEntry);
                    const isPendingOwnedSelection = getIsDexEntryPendingOwnedSelection({
                        dexEntry,
                        pendingOwnedEntryIds
                    });
                    const isSelected = selectedDexEntry
                        ? selectedDexEntry.dexNumber === dexEntry.dexNumber
                        : false;

                    return (
                        <button
                            key={dexEntry.dexNumber}
                            className={getDexListRowClassName({
                                selectedListDensity,
                                isSelected,
                                isPendingOwnedSelection
                            })}
                            type="button"
                            aria-pressed={isPendingOwnedSelection}
                            onClick={() => {
                                onPressDexEntry(dexEntry);
                            }}
                        >
                            {isSelectModeActive && isPendingOwnedSelection ? (
                                <SelectModeCheckmarkBadge indicatorLocation="list" />
                            ) : null}

                            <div className={getDexListDexNumberClassName(selectedListDensity)}>
                                #{dexEntry.dexNumber.toString().padStart(3, "0")}
                            </div>

                            <div className="min-w-0">
                                <div className={getDexListPokemonNameClassName(selectedListDensity)}>
                                    <span className={getDexListPokemonNameWrapperClassName(isSelected)}>
                                        {dexEntry.name}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span
                                    className={getDexListStatusBadgeClassName({
                                        status,
                                        selectedListDensity
                                    })}
                                >
                                    {getDexEntryStatusLabel(status)}
                                </span>
                            </div>

                            <div className="flex items-center">
                                {hasShinyCardIndicator ? (
                                    <span className={getShinyIndicatorClassName("list")}>
                                        <img
                                            src={shinyStarIcon}
                                            alt="Shiny collected"
                                            className="h-4 w-4 shrink-0 opacity-100 drop-shadow-[0_1px_1px_rgba(120,53,15,0.2)]"
                                        />
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-300">
                                        -
                                    </span>
                                )}
                            </div>

                            <div className={getDexListOwnershipGroupClassName(selectedListDensity)}>
                                <div
                                    className={getDexListOwnershipMetricClassName({
                                        selectedListDensity,
                                        isShiny: false
                                    })}
                                >
                                    <div
                                        className={getDexListOwnershipMetricLabelClassName({
                                            selectedListDensity,
                                            isShiny: false
                                        })}
                                    >
                                        <span className="md:hidden">Own</span>
                                        <span className="hidden md:inline">O</span>
                                    </div>
                                    <div
                                        className={getDexListOwnershipMetricValueClassName({
                                            selectedListDensity,
                                            isShiny: false
                                        })}
                                    >
                                        {dexEntry.ownership.totalOwnedCount}
                                    </div>
                                </div>

                                <div
                                    className={getDexListOwnershipMetricClassName({
                                        selectedListDensity,
                                        isShiny: true
                                    })}
                                >
                                    <div
                                        className={getDexListOwnershipMetricLabelClassName({
                                            selectedListDensity,
                                            isShiny: true
                                        })}
                                    >
                                        <span className="md:hidden">Sh</span>
                                        <span className="hidden md:inline">S</span>
                                    </div>
                                    <div
                                        className={getDexListOwnershipMetricValueClassName({
                                            selectedListDensity,
                                            isShiny: true
                                        })}
                                    >
                                        {dexEntry.ownership.shinyOwnedCount}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

// DexEntryDisplay switches between the existing card grid and the new dense list without re-filtering entries.
// LoadedDashboardView uses this so display layout and per-mode density stay modular while selection and filter state remain centralized.
export const DexEntryDisplay = ({
    entries,
    selectedDexEntry,
    selectedCollectionLayer,
    selectedGridDensity,
    selectedListDensity,
    selectedViewMode,
    isSelectModeActive,
    pendingOwnedEntryIds,
    onPressDexEntry
}: DexEntryDisplayProps) => {
    if (selectedViewMode === "list") {
        return (
            <ListDexEntryDisplay
                entries={entries}
                selectedDexEntry={selectedDexEntry}
                selectedCollectionLayer={selectedCollectionLayer}
                selectedListDensity={selectedListDensity}
                isSelectModeActive={isSelectModeActive}
                pendingOwnedEntryIds={pendingOwnedEntryIds}
                onPressDexEntry={onPressDexEntry}
            />
        );
    }

    return (
        <GridDexEntryDisplay
            entries={entries}
            selectedDexEntry={selectedDexEntry}
            selectedCollectionLayer={selectedCollectionLayer}
            selectedGridDensity={selectedGridDensity}
            isSelectModeActive={isSelectModeActive}
            pendingOwnedEntryIds={pendingOwnedEntryIds}
            onPressDexEntry={onPressDexEntry}
        />
    );
};
