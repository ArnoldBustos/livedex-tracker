import { useMemo, useState } from "react";
import { DashboardTopbar } from "../dashboard/DashboardTopbar";
import { DashboardSummary } from "../dashboard/DashboardSummary";
import type {
    DexCollectionLayerKey,
    DexDisplayStatus,
    DexEntry,
    DexFilter,
    DexGridDensity,
    DexResponse,
    DexScope,
    DexViewMode,
    SaveProfileRecord,
    UploadResponse
} from "../../types/save";
import { getDexEntriesForScope } from "../../lib/dex";
import { computeDexProgress } from "../../lib/dex/computeDexProgress";
import { getDisplayGameLabel } from "../../lib/getDisplayGameLabel";
import shinyStarIcon from "../../assets/shiny-star.png";
import { DexEntryDisplay } from "./DexEntryDisplay";

type LoadedDashboardViewProps = {
    uploadResponse: UploadResponse;
    dexResponse: DexResponse;
    saveProfiles: SaveProfileRecord[];
    activeSaveProfileId: string | null;
    selectedFilter: DexFilter;
    selectedCollectionLayer: DexCollectionLayerKey;
    selectedScope: DexScope;
    selectedGridDensity: DexGridDensity;
    selectedViewMode: DexViewMode;
    selectedDexNumber: number | null;
    errorMessage: string;
    isUploading: boolean;
    isGuestMode: boolean;
    sessionLabel: string;
    onChangeFilter: (nextFilter: DexFilter) => void;
    onChangeCollectionLayer: (nextLayer: DexCollectionLayerKey) => void;
    onChangeScope: (nextScope: DexScope) => void;
    onChangeViewMode: (nextViewMode: DexViewMode) => void;
    onDecreaseGridDensity: () => void;
    onIncreaseGridDensity: () => void;
    onSelectDexNumber: (nextDexNumber: number) => void;
    onSelectSaveProfile: (saveProfileId: string) => void;
    onDeleteProfile: (saveProfileId: string) => Promise<void>;
    onResetToEmptyState: () => void;
    onUpdateSave: (file: File) => void;
    onEditSaveProfile: () => void;
    onUpdateDexEntry: (params: {
        pokemonSpeciesId: number;
        patch: {
            standard?: {
                seen?: boolean | null;
                caught?: boolean | null;
                hasLivingEntry?: boolean | null;
            };
            shiny?: {
                seen?: boolean | null;
                caught?: boolean | null;
                hasLivingEntry?: boolean | null;
            };
        };
    }) => Promise<void> | void;
    onLogout: () => void;
    onGoToLogin: () => void;
    onGoToRegister: () => void;
};

// DashboardLayerSummary stores the visible totals for one collection layer in the active scope.
// LoadedDashboardView builds this for standard and shiny so summary cards and sidebar metrics stay aligned.
type DashboardLayerSummary = {
    totalCount: number;
    seenCount: number;
    caughtCount: number;
    livingCount: number;
    missingCount: number;
    seenOnlyCount: number;
};

// filterControlOptions lists the available content filters for the dashboard controls.
// LoadedDashboardView maps this so filter layout stays modular when options change.
const filterControlOptions: Array<{
    value: DexFilter;
    label: string;
}> = [
    {
        value: "all",
        label: "All"
    },
    {
        value: "living",
        label: "Living"
    },
    {
        value: "missing",
        label: "Missing"
    },
    {
        value: "seenOnly",
        label: "Seen Only"
    },
    {
        value: "caughtNotLiving",
        label: "Caught Not Living"
    }
];

// scopeControlOptions lists the available scope controls for the dashboard view group.
// LoadedDashboardView maps this so view-specific controls stay isolated from filter controls.
const scopeControlOptions: Array<{
    value: DexScope;
    label: string;
}> = [
    {
        value: "national",
        label: "National"
    },
    {
        value: "regional",
        label: "Regional"
    }
];

// viewModeControlOptions lists the available layout modes for the dex result set.
// LoadedDashboardView maps this so grid and list selection stay modular inside the existing View control section.
const viewModeControlOptions: Array<{
    value: DexViewMode;
    label: string;
}> = [
    {
        value: "grid",
        label: "Grid"
    },
    {
        value: "list",
        label: "List"
    }
];

// dexGridDensityOrder defines the density steps from fewest to most cards per row.
// LoadedDashboardView uses this to disable the minus and plus controls at the bounds.
const dexGridDensityOrder: DexGridDensity[] = [
    "extraComfortable",
    "comfortable",
    "default",
    "compact",
    "extraCompact"
];

// getDexEntryStatus returns the strongest collection state for one dex layer on one dex entry.
// cards, filters, summaries, and sidebar badges use this so standard and shiny status rules stay aligned.
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

// getDexEntryStatusLabel formats the card badge label for one collection state.
// LoadedDashboardView uses this so the visible status copy matches getDexEntryStatus.
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

// getHasShinyCardIndicator decides whether one card should show the display-only shiny marker.
// LoadedDashboardView uses this so shiny presence appears in the middle grid without adding shiny edit behavior there.
const getHasShinyCardIndicator = (dexEntry: DexEntry) => {
    return dexEntry.shiny.caught || dexEntry.shiny.hasLivingEntry;
};

// getShinyIndicatorClassName maps shiny marker context to stronger contrast styles.
// LoadedDashboardView uses this so the display-only shiny icon stays legible on cards and in the selected-Pokemon sidebar.
const getShinyIndicatorClassName = (indicatorLocation: "card" | "artwork" | "title") => {
    if (indicatorLocation === "artwork") {
        return "inline-flex items-center justify-center rounded-full border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200 shadow-sm";
    }

    if (indicatorLocation === "title") {
        return "inline-flex items-center justify-center rounded-full border border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200 shadow-sm";
    }

    return "inline-flex items-center justify-center rounded-full border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200 shadow-sm";
};

// getDashboardLayerSummary derives the visible counts for one collection layer in the active scope.
// LoadedDashboardView uses this so standard and shiny summary totals stay parallel without separate implementations.
const getDashboardLayerSummary = ({
    entries,
    scope,
    layerKey,
    summary
}: {
    entries: DexEntry[];
    scope: DexScope;
    layerKey: DexCollectionLayerKey;
    summary: DexResponse["summary"][DexCollectionLayerKey];
}): DashboardLayerSummary => {
    if (scope === "national") {
        const missingCount = summary.totalEntries - summary.seenCount;
        const seenOnlyCount = summary.seenCount - summary.caughtCount;

        return {
            totalCount: summary.totalEntries,
            seenCount: summary.seenCount,
            caughtCount: summary.caughtCount,
            livingCount: summary.livingCount,
            missingCount,
            seenOnlyCount
        };
    }

    const seenCount = entries.filter((dexEntry) => {
        return dexEntry[layerKey].seen;
    }).length;
    const caughtCount = entries.filter((dexEntry) => {
        return dexEntry[layerKey].caught;
    }).length;
    const livingCount = entries.filter((dexEntry) => {
        return dexEntry[layerKey].hasLivingEntry;
    }).length;
    const missingCount = entries.filter((dexEntry) => {
        return getDexEntryStatus(dexEntry, layerKey) === "missing";
    }).length;
    const seenOnlyCount = entries.filter((dexEntry) => {
        return getDexEntryStatus(dexEntry, layerKey) === "seen";
    }).length;

    return {
        totalCount: entries.length,
        seenCount,
        caughtCount,
        livingCount,
        missingCount,
        seenOnlyCount
    };
};

// getPokemonArtworkUrl builds the official artwork URL for the selected pokemon.
// the right sidebar uses this so the focused entry shows larger artwork than the grid cards.
const getPokemonArtworkUrl = (dexNumber: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`;
};

// getDexEntryImageToneClassName returns the artwork tone classes for one dex status.
// LoadedDashboardView uses this so missing entries stay visible but darker than seen or owned entries.
const getDexEntryImageToneClassName = (status: DexDisplayStatus) => {
    if (status === "missing") {
        return "opacity-55 brightness-75 saturate-0";
    }

    return "";
};

// slugifyPokemonDbName builds a Pokemon DB friendly slug from a species name
// the right sidebar external link buttons use this for pokemondb.net URLs
const slugifyPokemonDbName = (pokemonName: string) => {
    return pokemonName
        .toLowerCase()
        .replace("♀", "-f")
        .replace("♂", "-m")
        .replace(/\./g, "")
        .replace(/'/g, "")
        .replace(/\s+/g, "-");
};

// getBulbapediaUrl builds a Bulbapedia page URL for the selected pokemon
// the right sidebar uses this to open Bulbapedia in a new tab
const getBulbapediaUrl = (pokemonName: string) => {
    return `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(`${pokemonName}_(Pokémon)`)}`;
};

// getPokemonDbUrl builds a Pokemon DB page URL for the selected pokemon
// the right sidebar uses this to open pokemondb.net in a new tab
const getPokemonDbUrl = (pokemonName: string) => {
    return `https://pokemondb.net/pokedex/${slugifyPokemonDbName(pokemonName)}`;
};

// getSerebiiUrl builds a Serebii dex URL using the national dex number
// the right sidebar uses this to open the Gen 3 era style Pokedex page in a new tab
const getSerebiiUrl = (dexNumber: number) => {
    return `https://www.serebii.net/pokedex-rs/${dexNumber.toString().padStart(3, "0")}.shtml`;
};

// ControlChipButton renders one selectable control chip for filter and view groups.
// LoadedDashboardView uses this so both control sections share the same button treatment.
const ControlChipButton = ({
    label,
    isSelected,
    onClick
}: {
    label: string;
    isSelected: boolean;
    onClick: () => void;
}) => {
    return (
        <button
            className={
                isSelected
                    ? "inline-flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow"
                    : "inline-flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-gray-600"
            }
            type="button"
            onClick={onClick}
        >
            {label}
        </button>
    );
};

// SidebarToggleButton renders one yes/no action button for a selected dex flag.
// LoadedDashboardView uses this in the right sidebar for both standard and shiny seen, caught, and living edits.
const SidebarToggleButton = ({
    label,
    value,
    onToggle
}: {
    label: string;
    value: boolean;
    onToggle: () => void;
}) => {
    return (
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                {label}
            </span>

            <button
                className={
                    value
                        ? "rounded-lg bg-green-100 px-3 py-1 text-sm font-extrabold uppercase text-green-700 hover:bg-green-200"
                        : "rounded-lg bg-gray-200 px-3 py-1 text-sm font-extrabold uppercase text-gray-600 hover:bg-gray-300"
                }
                type="button"
                onClick={onToggle}
            >
                {value ? "Yes" : "No"}
            </button>
        </div>
    );
};

// SidebarSnapshotStat renders one compact ownership metric tile in the selected-entry summary area.
// LoadedDashboardView uses this so ownership counts stay visible while reducing nested card styling in the sidebar.
const SidebarSnapshotStat = ({
    label,
    value
}: {
    label: string;
    value: number;
}) => {
    return (
        <div className="rounded-lg border border-[rgba(130,129,111,0.14)] bg-white px-3 py-2">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
                {label}
            </div>
            <div className="mt-1 text-lg font-extrabold text-gray-900">
                {value}
            </div>
        </div>
    );
};

// CollectionLayerToggleButton renders the dashboard layer switch between standard and shiny evaluation.
// LoadedDashboardView uses this so filter logic can swap layers without duplicating the filter row.
const CollectionLayerToggleButton = ({
    selectedCollectionLayer,
    onClick
}: {
    selectedCollectionLayer: DexCollectionLayerKey;
    onClick: () => void;
}) => {
    const isShinySelected = selectedCollectionLayer === "shiny";

    return (
        <button
            className={
                isShinySelected
                    ? "flex min-h-[40px] items-center gap-2 rounded-lg border-2 border-slate-800 bg-[linear-gradient(135deg,#243345_0%,#2f455f_52%,#4c6a8a_100%)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-slate-700"
                    : "flex min-h-[40px] items-center gap-2 rounded-lg border-2 border-transparent bg-white px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50"
            }
            type="button"
            aria-pressed={isShinySelected}
            onClick={onClick}
        >
            <span
                className={
                    isShinySelected
                        ? "inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-white/12"
                        : "inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white"
                }
            >
                <img
                    src={shinyStarIcon}
                    alt=""
                    aria-hidden="true"
                    className={isShinySelected ? "h-3.5 w-3.5" : "h-3.5 w-3.5 opacity-55 saturate-0"}
                />
            </span>

            <span>Shiny</span>
        </button>
    );
};

// SelectedDexCollectionSection renders one manual edit block for either the standard or shiny collection layer.
// LoadedDashboardView uses this so the selected-Pokemon sidebar keeps both layers parallel and independently editable.
const SelectedDexCollectionSection = ({
    title,
    accentClassName,
    dexEntry,
    layerKey,
    onUpdateDexEntry
}: {
    title: string;
    accentClassName: string;
    dexEntry: DexEntry;
    layerKey: DexCollectionLayerKey;
    onUpdateDexEntry: LoadedDashboardViewProps["onUpdateDexEntry"];
}) => {
    const collectionState = dexEntry[layerKey];

    return (
        <section className="grid gap-2 border-t border-[rgba(130,129,111,0.12)] pt-3">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
                    {title}
                </span>

                <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${accentClassName}`}>
                    {getDexEntryStatusLabel(getDexEntryStatus(dexEntry, layerKey))}
                </span>
            </div>

            <SidebarToggleButton
                label="In Living Dex"
                value={collectionState.hasLivingEntry}
                onToggle={() => {
                    onUpdateDexEntry({
                        pokemonSpeciesId: dexEntry.pokemonSpeciesId,
                        patch: {
                            [layerKey]: {
                                hasLivingEntry: !collectionState.hasLivingEntry
                            }
                        }
                    });
                }}
            />

            <SidebarToggleButton
                label="Caught"
                value={collectionState.caught}
                onToggle={() => {
                    onUpdateDexEntry({
                        pokemonSpeciesId: dexEntry.pokemonSpeciesId,
                        patch: {
                            [layerKey]: {
                                caught: !collectionState.caught
                            }
                        }
                    });
                }}
            />

            <SidebarToggleButton
                label="Seen"
                value={collectionState.seen}
                onToggle={() => {
                    onUpdateDexEntry({
                        pokemonSpeciesId: dexEntry.pokemonSpeciesId,
                        patch: {
                            [layerKey]: {
                                seen: !collectionState.seen
                            }
                        }
                    });
                }}
            />
        </section>
    );
};

export const LoadedDashboardView = ({
    uploadResponse,
    dexResponse,
    saveProfiles,
    activeSaveProfileId,
    selectedFilter,
    selectedCollectionLayer,
    selectedScope,
    selectedGridDensity,
    selectedViewMode,
    selectedDexNumber,
    errorMessage,
    isUploading,
    isGuestMode,
    sessionLabel,
    onChangeFilter,
    onChangeCollectionLayer,
    onChangeScope,
    onChangeViewMode,
    onDecreaseGridDensity,
    onIncreaseGridDensity,
    onSelectDexNumber,
    onSelectSaveProfile,
    onResetToEmptyState,
    onUpdateSave,
    onEditSaveProfile,
    onDeleteProfile,
    onUpdateDexEntry,
    onLogout,
    onGoToLogin,
    onGoToRegister
}: LoadedDashboardViewProps) => {
    // pendingDeleteProfileId tracks which profile is showing inline delete confirmation
    // the profile list uses this to swap the Delete button into confirm/cancel actions
    const [pendingDeleteProfileId, setPendingDeleteProfileId] = useState<string | null>(null);
    // selectedGridDensityIndex tracks the current density step within the ordered scale.
    // LoadedDashboardView uses this so the minus and plus buttons disable at the correct reversed bounds.
    const selectedGridDensityIndex = dexGridDensityOrder.indexOf(selectedGridDensity);
    // isDecreaseGridDensityDisabled blocks the minus control at the smallest-card density bound.
    // the reversed minus behavior uses this so users can always step back from larger card sizes.
    const isDecreaseGridDensityDisabled = selectedGridDensityIndex === dexGridDensityOrder.length - 1;
    // isIncreaseGridDensityDisabled blocks the plus control at the largest-card density bound.
    // the reversed plus behavior uses this so users can always step back from smaller card sizes.
    const isIncreaseGridDensityDisabled = selectedGridDensityIndex === 0;

    const trainerName =
        uploadResponse.trainerInfo && uploadResponse.trainerInfo.name
            ? uploadResponse.trainerInfo.name
            : uploadResponse.debug && uploadResponse.debug.trainerName
                ? uploadResponse.debug.trainerName
                : "Unknown Trainer";

    const trainerGender =
        uploadResponse.trainerInfo && uploadResponse.trainerInfo.gender
            ? uploadResponse.trainerInfo.gender
            : uploadResponse.debug && uploadResponse.debug.trainerGender
                ? uploadResponse.debug.trainerGender
                : "Unknown";
    // displayGameLabel resolves one honest visible game label from exact-title detection or layout-family fallback.
    const displayGameLabel = getDisplayGameLabel({
        detectedGame: uploadResponse.upload.detectedGame,
        detectedLayout: uploadResponse.debug ? uploadResponse.debug.detectedLayout : undefined,
        saveProfileGame: uploadResponse.saveProfile.game
    });

    const prettyResponse = useMemo(() => {
        return JSON.stringify(uploadResponse, null, 2);
    }, [uploadResponse]);

    const dexEntries = useMemo(() => {
        return getDexEntriesForScope({
            entries: dexResponse.entries,
            scope: selectedScope,
            game: uploadResponse.saveProfile.game ?? uploadResponse.upload.detectedGame
        });
    }, [dexResponse.entries, selectedScope, uploadResponse.saveProfile.game, uploadResponse.upload.detectedGame]);

    const filteredDexEntries = useMemo(() => {
        return dexEntries.filter((dexEntry) => {
            const status = getDexEntryStatus(dexEntry, selectedCollectionLayer);

            if (selectedFilter === "all") {
                return true;
            }

            if (selectedFilter === "living") {
                return status === "living";
            }

            if (selectedFilter === "missing") {
                return status === "missing";
            }

            if (selectedFilter === "seenOnly") {
                return status === "seen";
            }

            if (selectedFilter === "caughtNotLiving") {
                return status === "caught";
            }

            return true;
        });
    }, [dexEntries, selectedCollectionLayer, selectedFilter]);

    // selectedDexEntry keeps the sidebar focused on the chosen dex entry even when filters remove it from the grid.
    // LoadedDashboardView uses this so manual edits in filtered views do not immediately replace the right-sidebar focus.
    const selectedDexEntry = useMemo(() => {
        if (selectedDexNumber !== null) {
            const matchedDexEntry = dexEntries.find((dexEntry) => {
                return dexEntry.dexNumber === selectedDexNumber;
            });

            if (matchedDexEntry) {
                return matchedDexEntry;
            }
        }

        if (filteredDexEntries.length === 0) {
            return null;
        }

        return filteredDexEntries[0];
    }, [dexEntries, filteredDexEntries, selectedDexNumber]);

    // dashboardSummary derives the active scope counts used by the active-layer summary cards and progress labels.
    // DashboardSummary and the completion bar read this object so standard and shiny totals share one modular path.
    const dashboardSummary = useMemo(() => {
        return getDashboardLayerSummary({
            entries: dexEntries,
            scope: selectedScope,
            layerKey: selectedCollectionLayer,
            summary: dexResponse.summary[selectedCollectionLayer]
        });
    }, [dexEntries, dexResponse.summary, selectedCollectionLayer, selectedScope]);

    // completionPercentage keeps the sidebar progress bar aligned with the shared active-layer summary percentage logic.
    const completionPercentage = computeDexProgress({
        total: dashboardSummary.totalCount,
        seen: dashboardSummary.seenCount,
        caught: dashboardSummary.caughtCount,
        living: dashboardSummary.livingCount
    }).livingPercent;

    return (
        <>
            <DashboardTopbar
                gameLabel={displayGameLabel}
                isUploading={isUploading}
                isGuestMode={isGuestMode}
                sessionLabel={sessionLabel}
                onReset={onResetToEmptyState}
                onUpdateSave={onUpdateSave}
                onLogout={onLogout}
                onGoToLogin={onGoToLogin}
                onGoToRegister={onGoToRegister}
            />

            <div
                className={
                    isGuestMode
                        ? "grid min-h-[calc(100vh-84px)] grid-cols-1 gap-4 bg-[#f3f4f6] px-4 py-4 xl:grid-cols-[minmax(0,1fr)_240px]"
                        : "grid min-h-[calc(100vh-84px)] grid-cols-1 gap-4 bg-[#f3f4f6] px-4 py-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_240px]"
                }
            >
                {!isGuestMode ? (
                    <aside className="sticky top-4 self-start max-h-[calc(100vh-32px)] overflow-y-auto rounded-2xl bg-white p-4 shadow-sm flex flex-col gap-4">
                        <div className="rounded-xl border border-[rgba(130,129,111,0.12)] bg-gray-50/70 p-4">
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                                Profiles
                            </div>

                        <div className="mt-3 flex flex-col gap-2.5">
                            {saveProfiles.map((saveProfile) => {
                                const isActiveProfile = saveProfile.id === activeSaveProfileId;
                                const isPendingDelete = pendingDeleteProfileId === saveProfile.id;

                                return (
                                    <div
                                        key={saveProfile.id}
                                        className={
                                            isActiveProfile
                                                ? "rounded-[16px] border border-[rgba(147,86,0,0.3)] bg-white px-3 py-3 shadow-sm"
                                                : "rounded-[16px] border border-[rgba(130,129,111,0.12)] bg-white/90 px-3 py-3"
                                        }
                                    >
                                        <button
                                            className="flex w-full flex-col items-start text-left transition"
                                            type="button"
                                            onClick={() => {
                                                onSelectSaveProfile(saveProfile.id);
                                            }}
                                        >
                                            <div className="w-full truncate text-[15px] font-extrabold text-[#38392a]">
                                                {saveProfile.name}
                                            </div>

                                            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#935600]">
                                                {isActiveProfile
                                                    ? displayGameLabel
                                                    : saveProfile.game || "Unknown Game"}
                                            </div>

                                            <div className="mt-1 text-[11px] text-[#656554]">
                                                {isActiveProfile
                                                    ? `${trainerName}${trainerGender === "Unknown" ? "" : ` · ${trainerGender} trainer`}`
                                                    : "Saved profile"}
                                            </div>
                                        </button>

                                        {!isPendingDelete ? (
                                            <div className="mt-2 flex items-center justify-between gap-2 border-t border-[rgba(130,129,111,0.1)] pt-2">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a8b78]">
                                                    {isActiveProfile ? "Active profile" : "Saved profile"}
                                                </span>
                                                <button
                                                    className="rounded-md px-2 py-1 text-[11px] font-medium text-[#8a8b78] hover:bg-red-50 hover:text-[#912018]"
                                                    type="button"
                                                    onClick={() => {
                                                        setPendingDeleteProfileId(saveProfile.id);
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mt-2 border-t border-[rgba(130,129,111,0.1)] pt-2">
                                                <div className="rounded-xl border border-red-100 bg-[rgba(255,244,244,0.9)] p-3">
                                                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#b42318]">
                                                        Delete profile
                                                    </div>

                                                    <div className="mt-1 text-[11px] text-[#7a271a]">
                                                        Remove this saved profile?
                                                    </div>

                                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                                        <button
                                                            className="rounded-lg border border-[rgba(130,129,111,0.18)] bg-white px-3 py-2 text-[11px] font-medium text-[#656554] hover:bg-gray-50"
                                                            type="button"
                                                            onClick={() => {
                                                                setPendingDeleteProfileId(null);
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>

                                                        <button
                                                            className="rounded-lg bg-[#d92d20] px-3 py-2 text-[11px] font-medium text-white hover:bg-[#b42318]"
                                                            type="button"
                                                            onClick={async () => {
                                                                await onDeleteProfile(saveProfile.id);
                                                                setPendingDeleteProfileId(null);
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button
                            className="w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-800"
                            type="button"
                        >
                            Generate Report
                        </button>
                    </div>
                </aside>
                ) : null}

                <main className="flex flex-col gap-4">
                    {errorMessage ? (
                        <div className="message error-message">{errorMessage}</div>
                    ) : null}

                    <DashboardSummary
                        saveProfileName={uploadResponse.saveProfile.name}
                        trainerName={trainerName}
                        gameLabel={displayGameLabel}
                        activeCollectionLayer={selectedCollectionLayer}
                        onEditSaveProfile={onEditSaveProfile}
                        totalCount={dashboardSummary.totalCount}
                        seenCount={dashboardSummary.seenCount}
                        caughtCount={dashboardSummary.caughtCount}
                        livingCount={dashboardSummary.livingCount}
                        missingCount={dashboardSummary.missingCount}
                        seenOnlyCount={dashboardSummary.seenOnlyCount}
                    />

                    <section className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(130,129,111,0.18)] bg-white/80 px-4 py-3 shadow-sm">
                            <div className="min-w-0">
                                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
                                    {selectedScope === "national" ? "National Dex" : "Regional Dex"}
                                </h2>
                            </div>

                            <div className="flex min-w-0 flex-wrap items-stretch gap-2 rounded-xl bg-gray-100 p-1 sm:flex-nowrap">
                                {viewModeControlOptions.map((viewModeOption) => {
                                    return (
                                        <ControlChipButton
                                            key={viewModeOption.value}
                                            label={viewModeOption.label}
                                            isSelected={selectedViewMode === viewModeOption.value}
                                            onClick={() => {
                                                onChangeViewMode(viewModeOption.value);
                                            }}
                                        />
                                    );
                                })}

                                {selectedViewMode === "grid" ? (
                                    <div className="ml-1 flex min-h-[40px] items-center gap-1 rounded-lg border border-white/80 bg-white px-1 py-1 shadow-sm">
                                        <button
                                            className={
                                                isDecreaseGridDensityDisabled
                                                    ? "rounded-md px-2 py-1 text-sm font-extrabold text-gray-300"
                                                    : "rounded-md px-2 py-1 text-sm font-extrabold text-gray-600 hover:bg-gray-100"
                                            }
                                            type="button"
                                            onClick={onDecreaseGridDensity}
                                            disabled={isDecreaseGridDensityDisabled}
                                            aria-label="Show more cards per row with smaller cards"
                                        >
                                            -
                                        </button>

                                        <button
                                            className={
                                                isIncreaseGridDensityDisabled
                                                    ? "rounded-md px-2 py-1 text-sm font-extrabold text-gray-300"
                                                    : "rounded-md px-2 py-1 text-sm font-extrabold text-gray-600 hover:bg-gray-100"
                                            }
                                            type="button"
                                            onClick={onIncreaseGridDensity}
                                            disabled={isIncreaseGridDensityDisabled}
                                            aria-label="Show fewer cards per row with larger cards"
                                        >
                                            +
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex w-full flex-wrap items-start gap-3 rounded-2xl border border-[rgba(130,129,111,0.18)] bg-white/80 px-3 py-3 shadow-sm xl:flex-nowrap xl:items-start">
                            <div className="min-w-0 xl:flex-1">
                                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                                    Filter
                                </p>

                                <div className="flex flex-wrap items-stretch gap-2 rounded-xl bg-gray-100 p-1 xl:flex-nowrap">
                                    {filterControlOptions.map((filterOption) => {
                                        return (
                                            <ControlChipButton
                                                key={filterOption.value}
                                                label={filterOption.label}
                                                isSelected={selectedFilter === filterOption.value}
                                                onClick={() => {
                                                    onChangeFilter(filterOption.value);
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="min-w-0 xl:shrink-0">
                                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                                    Shiny
                                </p>

                                <div className="rounded-xl bg-gray-100 p-1">
                                    <CollectionLayerToggleButton
                                        selectedCollectionLayer={selectedCollectionLayer}
                                        onClick={() => {
                                            onChangeCollectionLayer(
                                                selectedCollectionLayer === "standard" ? "shiny" : "standard"
                                            );
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="min-w-0 xl:shrink-0">
                                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                                    Scope
                                </p>

                                <div className="flex flex-wrap items-stretch gap-2 rounded-xl bg-gray-100 p-1 sm:flex-nowrap">
                                    {scopeControlOptions.map((scopeOption) => {
                                        return (
                                            <ControlChipButton
                                                key={scopeOption.value}
                                                label={scopeOption.label}
                                                isSelected={selectedScope === scopeOption.value}
                                                onClick={() => {
                                                    onChangeScope(scopeOption.value);
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    <DexEntryDisplay
                        entries={filteredDexEntries}
                        selectedDexEntry={selectedDexEntry}
                        selectedCollectionLayer={selectedCollectionLayer}
                        selectedGridDensity={selectedGridDensity}
                        selectedViewMode={selectedViewMode}
                        onSelectDexNumber={onSelectDexNumber}
                    />

                    <details className="debug-details">
                        <summary>Raw Debug Response</summary>
                        <pre className="debug-block">{prettyResponse}</pre>
                    </details>
                </main>

                <aside className="sticky top-4 hidden self-start rounded-2xl bg-white p-3 shadow-sm xl:flex xl:flex-col">
                    <div className="flex max-h-[calc(100vh-32px)] flex-col gap-3 overflow-y-auto pr-1">
                        <div className="flex items-center justify-center rounded-xl bg-gray-100/80 p-3">
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow">
                                {selectedDexEntry ? (
                                    <img
                                        src={getPokemonArtworkUrl(selectedDexEntry.dexNumber)}
                                        alt={selectedDexEntry.name}
                                        className={`max-h-full max-w-full object-contain ${getDexEntryImageToneClassName(getDexEntryStatus(selectedDexEntry, selectedCollectionLayer))}`.trim()}
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-gray-300">?</span>
                                )}

                                {selectedDexEntry && getHasShinyCardIndicator(selectedDexEntry) ? (
                                    <span className={`${getShinyIndicatorClassName("artwork")} absolute right-0 bottom-0 h-8 w-8`}>
                                        <img
                                            src={shinyStarIcon}
                                            alt="Shiny collected"
                                            className="h-5 w-5 drop-shadow-[0_1px_1px_rgba(120,53,15,0.2)]"
                                        />
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                                {selectedDexEntry
                                    ? `Dex No. ${selectedDexEntry.dexNumber.toString().padStart(3, "0")}`
                                    : "No Selection"}
                            </p>

                            <div className="flex items-center justify-center gap-2">
                                <h3 className="text-center text-2xl font-extrabold tracking-tight text-gray-900">
                                    {selectedDexEntry ? selectedDexEntry.name : "Choose a Pokémon"}
                                </h3>

                                {selectedDexEntry && getHasShinyCardIndicator(selectedDexEntry) ? (
                                    <span className={`${getShinyIndicatorClassName("title")} h-7 w-7 shrink-0`}>
                                        <img
                                            src={shinyStarIcon}
                                            alt="Shiny collected"
                                            className="h-4.5 w-4.5 drop-shadow-[0_1px_1px_rgba(120,53,15,0.2)]"
                                        />
                                    </span>
                                ) : null}
                            </div>

                            {selectedDexEntry ? (
                                <div className="grid gap-2 border-t border-[rgba(130,129,111,0.12)] pt-3">
                                    <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
                                        Reference Links
                                    </div>

                                    <div className="grid gap-2">
                                        <a
                                        className="rounded-xl border border-[rgba(130,129,111,0.14)] bg-white px-3 py-2 text-center text-xs font-semibold text-[#38392a] transition hover:bg-gray-50"
                                        href={getBulbapediaUrl(selectedDexEntry.name)}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open in Bulbapedia
                                    </a>

                                        <a
                                        className="rounded-xl border border-[rgba(130,129,111,0.14)] bg-white px-3 py-2 text-center text-xs font-semibold text-[#38392a] transition hover:bg-gray-50"
                                        href={getPokemonDbUrl(selectedDexEntry.name)}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open in Pokémon DB
                                    </a>

                                        <a
                                        className="rounded-xl border border-[rgba(130,129,111,0.14)] bg-white px-3 py-2 text-center text-xs font-semibold text-[#38392a] transition hover:bg-gray-50"
                                        href={getSerebiiUrl(selectedDexEntry.dexNumber)}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open in Serebii
                                    </a>
                                    </div>
                                </div>
                            ) : null}

                            <div className="grid gap-3 rounded-xl border border-[rgba(130,129,111,0.12)] bg-gray-50/70 p-3">
                                {selectedDexEntry ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <SidebarSnapshotStat
                                                label="Owned"
                                                value={selectedDexEntry.ownership.totalOwnedCount}
                                            />

                                            <SidebarSnapshotStat
                                                label="Shiny Owned"
                                                value={selectedDexEntry.ownership.shinyOwnedCount}
                                            />
                                        </div>

                                        <SelectedDexCollectionSection
                                            title="Standard Collection"
                                            accentClassName="bg-emerald-100 text-emerald-700"
                                            dexEntry={selectedDexEntry}
                                            layerKey="standard"
                                            onUpdateDexEntry={onUpdateDexEntry}
                                        />

                                        <SelectedDexCollectionSection
                                            title="Shiny Collection"
                                            accentClassName="bg-amber-100 text-amber-700"
                                            dexEntry={selectedDexEntry}
                                            layerKey="shiny"
                                            onUpdateDexEntry={onUpdateDexEntry}
                                        />
                                    </>
                                ) : (
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between rounded-lg border border-[rgba(130,129,111,0.14)] bg-white px-3 py-2">
                                            <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                                                Standard Collection
                                            </span>
                                            <strong className="text-sm font-extrabold uppercase text-gray-400">
                                                Missing
                                            </strong>
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border border-[rgba(130,129,111,0.14)] bg-white px-3 py-2">
                                            <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                                                Shiny Collection
                                            </span>
                                            <strong className="text-sm font-extrabold uppercase text-gray-400">
                                                Missing
                                            </strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border border-[rgba(130,129,111,0.12)] bg-gray-50/70 p-4">
                                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
                                    Collection Analysis
                                </p>

                                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-gray-700">
                                    <span>Total Completion</span>
                                    <span>{completionPercentage}%</span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                                        style={{
                                            width: `${completionPercentage}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div >
        </>
    );
};
