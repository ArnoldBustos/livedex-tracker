import { useMemo, useState } from "react";
import { DashboardTopbar } from "../dashboard/DashboardTopbar";
import { DashboardSummary } from "../dashboard/DashboardSummary";
import type {
    DexDisplayStatus,
    DexEntry,
    DexFilter,
    DexGridDensity,
    DexResponse,
    DexScope,
    SaveProfileRecord,
    UploadResponse
} from "../../types/save";
import { getPokemonTypeBadgeStyle } from "../../lib/pokemonTypeStyles";
import { getDexEntriesForScope } from "../../lib/dex";

type LoadedDashboardViewProps = {
    uploadResponse: UploadResponse;
    dexResponse: DexResponse;
    saveProfiles: SaveProfileRecord[];
    activeSaveProfileId: string | null;
    selectedFilter: DexFilter;
    selectedScope: DexScope;
    selectedGridDensity: DexGridDensity;
    selectedDexNumber: number | null;
    errorMessage: string;
    isUploading: boolean;
    isGuestMode: boolean;
    sessionLabel: string;
    onChangeFilter: (nextFilter: DexFilter) => void;
    onChangeScope: (nextScope: DexScope) => void;
    onDecreaseGridDensity: () => void;
    onIncreaseGridDensity: () => void;
    onSelectDexNumber: (nextDexNumber: number) => void;
    onSelectSaveProfile: (saveProfileId: string) => void;
    onDeleteProfile: (saveProfileId: string) => Promise<void>;
    onResetToEmptyState: () => void;
    onUpdateSave: (file: File) => void;
    onUpdateDexEntry: (params: {
        pokemonSpeciesId: number;
        patch: {
            seen?: boolean | null;
            caught?: boolean | null;
            hasLivingEntry?: boolean | null;
        };
    }) => Promise<void> | void;
    onLogout: () => void;
    onGoToLogin: () => void;
    onGoToRegister: () => void;
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

// dexGridDensityOrder defines the density steps from fewest to most cards per row.
// LoadedDashboardView uses this to disable the minus and plus controls at the bounds.
const dexGridDensityOrder: DexGridDensity[] = [
    "extraComfortable",
    "comfortable",
    "default",
    "compact",
    "extraCompact"
];

// getDexEntryStatus returns the strongest collection state for one dex entry.
// cards, filters, and summary counts use this so UI status rules stay aligned.
const getDexEntryStatus = (dexEntry: DexEntry): DexDisplayStatus => {
    if (dexEntry.hasLivingEntry) {
        return "living";
    }

    if (dexEntry.caught) {
        return "caught";
    }

    if (dexEntry.seen) {
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

// getDexGridSectionClassName chooses the grid sizing classes for the active density option.
// LoadedDashboardView uses this to keep density layout mapping out of the JSX tree.
const getDexGridSectionClassName = (selectedGridDensity: DexGridDensity) => {
    if (selectedGridDensity === "extraComfortable") {
        return "grid grid-cols-[repeat(auto-fill,minmax(192px,1fr))] gap-5";
    }

    if (selectedGridDensity === "comfortable") {
        return "grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-4";
    }

    if (selectedGridDensity === "extraCompact") {
        return "grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2";
    }

    if (selectedGridDensity === "compact") {
        return "grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3";
    }

    return "grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3";
};

// getDexCardImageClassName chooses sprite sizing for the active density option.
// LoadedDashboardView uses this so compact and comfortable cards scale consistently with the grid.
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
// the card grid uses this so discovered pokemon render with consistent artwork.
const getPokemonSpriteUrl = (dexNumber: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${dexNumber}.png`;
};

// getPokemonArtworkUrl builds the official artwork URL for the selected pokemon.
// the right sidebar uses this so the focused entry shows larger artwork than the grid cards.
const getPokemonArtworkUrl = (dexNumber: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`;
};

// formatPokemonTypeLabel converts API casing into the badge label casing shown on cards.
// LoadedDashboardView uses this so type pills render consistent readable labels.
const formatPokemonTypeLabel = (pokemonType: string) => {
    return `${pokemonType.charAt(0)}${pokemonType.slice(1).toLowerCase()}`;
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
                    ? "rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow"
                    : "rounded-lg px-3 py-2 text-sm font-semibold text-gray-600"
            }
            type="button"
            onClick={onClick}
        >
            {label}
        </button>
    );
};

// SidebarToggleButton renders one yes/no action button for a selected dex flag.
// LoadedDashboardView uses this in the right sidebar for seen, caught, and living manual edits.
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
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
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

export const LoadedDashboardView = ({
    uploadResponse,
    dexResponse,
    saveProfiles,
    activeSaveProfileId,
    selectedFilter,
    selectedScope,
    selectedGridDensity,
    selectedDexNumber,
    errorMessage,
    isUploading,
    isGuestMode,
    sessionLabel,
    onChangeFilter,
    onChangeScope,
    onDecreaseGridDensity,
    onIncreaseGridDensity,
    onSelectDexNumber,
    onSelectSaveProfile,
    onResetToEmptyState,
    onUpdateSave,
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

    const prettyResponse = useMemo(() => {
        return JSON.stringify(uploadResponse, null, 2);
    }, [uploadResponse]);

    const dexEntries = useMemo(() => {
        return getDexEntriesForScope({
            entries: dexResponse.entries,
            scope: selectedScope,
            game: uploadResponse.upload.detectedGame ?? uploadResponse.saveProfile.game
        });
    }, [dexResponse.entries, selectedScope, uploadResponse.saveProfile.game, uploadResponse.upload.detectedGame]);

    const filteredDexEntries = useMemo(() => {
        return dexEntries.filter((dexEntry) => {
            const status = getDexEntryStatus(dexEntry);

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
    }, [dexEntries, selectedFilter]);

    const selectedDexEntry = useMemo(() => {
        if (filteredDexEntries.length === 0) {
            return null;
        }

        if (selectedDexNumber === null) {
            return filteredDexEntries[0];
        }

        const matchedDexEntry = filteredDexEntries.find((dexEntry) => {
            return dexEntry.dexNumber === selectedDexNumber;
        });

        if (matchedDexEntry) {
            return matchedDexEntry;
        }

        return filteredDexEntries[0];
    }, [filteredDexEntries, selectedDexNumber]);

    const dashboardSummary = useMemo(() => {
        const seenCount = dexEntries.filter((dexEntry) => {
            return dexEntry.seen;
        }).length;

        const caughtCount = dexEntries.filter((dexEntry) => {
            return dexEntry.caught;
        }).length;

        const livingCount = dexEntries.filter((dexEntry) => {
            return dexEntry.hasLivingEntry;
        }).length;

        const missingCount = dexEntries.filter((dexEntry) => {
            return getDexEntryStatus(dexEntry) === "missing";
        }).length;

        const seenOnlyCount = dexEntries.filter((dexEntry) => {
            return getDexEntryStatus(dexEntry) === "seen";
        }).length;

        return {
            seenCount,
            caughtCount,
            livingCount,
            missingCount,
            seenOnlyCount
        };
    }, [dexEntries]);

    const completionPercentage = dexEntries.length > 0
        ? Math.round((dashboardSummary.livingCount / dexEntries.length) * 100)
        : 0;

    return (
        <>
            <DashboardTopbar
                gameLabel={uploadResponse.upload.detectedGame || "Gen 3 Save"}
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
                        ? "grid min-h-[calc(100vh-84px)] grid-cols-[minmax(0,1fr)_288px] gap-4 bg-[#f3f4f6] px-4 py-4"
                        : "grid min-h-[calc(100vh-84px)] grid-cols-[248px_minmax(0,1fr)_288px] gap-4 bg-[#f3f4f6] px-4 py-4"
                }
            >
                {!isGuestMode ? (
                    <aside className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
                        <div className="rounded-xl bg-gray-50 p-4">
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                                Profiles
                            </div>

                        <div className="mt-3 flex flex-col gap-4">
                            {saveProfiles.map((saveProfile) => {
                                const isActiveProfile = saveProfile.id === activeSaveProfileId;
                                const isPendingDelete = pendingDeleteProfileId === saveProfile.id;

                                return (
                                    <div
                                        key={saveProfile.id}
                                        className="rounded-[16px] bg-white/60 p-2"
                                    >
                                        <button
                                            className={
                                                isActiveProfile
                                                    ? "flex w-full flex-col items-start rounded-[14px] border border-[rgba(147,86,0,0.38)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-left transition"
                                                    : "flex w-full flex-col items-start rounded-[14px] border border-[rgba(130,129,111,0.18)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-left transition hover:border-[rgba(147,86,0,0.38)]"
                                            }
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
                                                    ? uploadResponse.upload.detectedGame || "Unknown Game"
                                                    : saveProfile.game || "Unknown Game"}
                                            </div>

                                            <div className="mt-1 text-[11px] text-[#656554]">
                                                {isActiveProfile
                                                    ? `${trainerName}${trainerGender === "Unknown" ? "" : ` · ${trainerGender} trainer`}`
                                                    : "Saved profile"}
                                            </div>
                                        </button>

                                        {!isPendingDelete ? (
                                            <div className="flex justify-end pt-1">
                                                <button
                                                    className="rounded-md px-2 py-1 text-[11px] font-medium text-[#b42318] hover:bg-red-50 hover:text-[#912018]"
                                                    type="button"
                                                    onClick={() => {
                                                        setPendingDeleteProfileId(saveProfile.id);
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="pt-2">
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
                        gameLabel={uploadResponse.upload.detectedGame || "Unknown Game"}
                        caughtCount={dashboardSummary.caughtCount}
                        livingCount={dashboardSummary.livingCount}
                        missingCount={dashboardSummary.missingCount}
                        seenOnlyCount={dashboardSummary.seenOnlyCount}
                    />

                    <section className="flex flex-wrap items-end justify-between gap-4">
                        <div className="min-w-0">
                            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                                Database View
                            </p>
                            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
                                {selectedScope === "national" ? "National Dex" : "Regional Dex"}
                            </h2>
                        </div>

                        <div className="flex w-full flex-wrap items-start justify-between gap-2 rounded-2xl border border-[rgba(130,129,111,0.18)] bg-white/80 px-3 py-3 shadow-sm">
                            <div className="min-w-0">
                                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                                    Filter
                                </p>

                                <div className="flex flex-wrap gap-2 rounded-xl bg-gray-100 p-1">
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

                            <div className="min-w-0">
                                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                                    View
                                </p>

                                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-100 p-1">
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

                                    <div className="ml-1 flex items-center gap-1 rounded-lg border border-white/80 bg-white px-1 py-1 shadow-sm">
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
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={getDexGridSectionClassName(selectedGridDensity)}>
                        {filteredDexEntries.map((dexEntry) => {
                            const status = getDexEntryStatus(dexEntry);
                            const isSelected = selectedDexEntry
                                ? selectedDexEntry.dexNumber === dexEntry.dexNumber
                                : false;

                            return (
                                <button
                                    key={dexEntry.dexNumber}
                                    className={
                                        isSelected
                                            ? "flex flex-col rounded-xl border-2 border-green-500 bg-white p-3 shadow-sm"
                                            : "flex flex-col rounded-xl bg-white p-3 shadow-sm hover:shadow-md"
                                    }
                                    type="button"
                                    onClick={() => {
                                        onSelectDexNumber(dexEntry.dexNumber);
                                    }}
                                >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <span className="text-[10px] font-extrabold tracking-[0.04em] text-gray-400">
                                            #{dexEntry.dexNumber.toString().padStart(3, "0")}
                                        </span>

                                        <span
                                            className={
                                                status === "living"
                                                    ? "rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold uppercase text-green-700"
                                                    : status === "caught"
                                                        ? "rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold uppercase text-yellow-700"
                                                        : status === "seen"
                                                            ? "rounded-full bg-purple-100 px-2 py-1 text-[10px] font-bold uppercase text-purple-700"
                                                            : "rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase text-gray-500"
                                            }
                                        >
                                            {getDexEntryStatusLabel(status)}
                                        </span>
                                    </div>

                                    <div className="flex h-[88px] items-center justify-center overflow-hidden">
                                        {status === "missing" ? (
                                            <span className="text-2xl font-bold text-gray-300">?</span>
                                        ) : (
                                            <img
                                                src={getPokemonSpriteUrl(dexEntry.dexNumber)}
                                                alt={dexEntry.name}
                                                className={getDexCardImageClassName(selectedGridDensity)}
                                            />
                                        )}
                                    </div>

                                    <div className="mt-2 text-sm font-extrabold tracking-[0.01em] text-gray-900">
                                        {dexEntry.name}
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-1">
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

                    <details className="debug-details">
                        <summary>Raw Debug Response</summary>
                        <pre className="debug-block">{prettyResponse}</pre>
                    </details>
                </main>

                <aside className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-center rounded-xl bg-gray-100 p-4">
                        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white shadow">
                            {selectedDexEntry ? (
                                <img
                                    src={getPokemonArtworkUrl(selectedDexEntry.dexNumber)}
                                    alt={selectedDexEntry.name}
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-gray-300">?</span>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                            {selectedDexEntry
                                ? `Dex No. ${selectedDexEntry.dexNumber.toString().padStart(3, "0")}`
                                : "No Selection"}
                        </p>

                        <h3 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
                            {selectedDexEntry ? selectedDexEntry.name : "Choose a Pokémon"}
                        </h3>

                        {selectedDexEntry ? (
                            <div className="grid gap-2">
                                <a
                                    className="rounded-xl border border-[rgba(130,129,111,0.18)] bg-gray-50 px-4 py-3 text-center text-xs font-semibold text-[#38392a] hover:bg-gray-100"
                                    href={getBulbapediaUrl(selectedDexEntry.name)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Open in Bulbapedia
                                </a>

                                <a
                                    className="rounded-xl border border-[rgba(130,129,111,0.18)] bg-gray-50 px-4 py-3 text-center text-xs font-semibold text-[#38392a] hover:bg-gray-100"
                                    href={getPokemonDbUrl(selectedDexEntry.name)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Open in Pokémon DB
                                </a>

                                <a
                                    className="rounded-xl border border-[rgba(130,129,111,0.18)] bg-gray-50 px-4 py-3 text-center text-xs font-semibold text-[#38392a] hover:bg-gray-100"
                                    href={getSerebiiUrl(selectedDexEntry.dexNumber)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Open in Serebii
                                </a>
                            </div>
                        ) : null}

                        <div className="grid gap-3">
                            {selectedDexEntry ? (
                                <>
                                    <SidebarToggleButton
                                        label="In Living Dex"
                                        value={selectedDexEntry.hasLivingEntry}
                                        onToggle={() => {
                                            onUpdateDexEntry({
                                                pokemonSpeciesId: selectedDexEntry.pokemonSpeciesId,
                                                patch: {
                                                    hasLivingEntry: !selectedDexEntry.hasLivingEntry
                                                }
                                            });
                                        }}
                                    />

                                    <SidebarToggleButton
                                        label="Caught"
                                        value={selectedDexEntry.caught}
                                        onToggle={() => {
                                            onUpdateDexEntry({
                                                pokemonSpeciesId: selectedDexEntry.pokemonSpeciesId,
                                                patch: {
                                                    caught: !selectedDexEntry.caught
                                                }
                                            });
                                        }}
                                    />

                                    <SidebarToggleButton
                                        label="Seen"
                                        value={selectedDexEntry.seen}
                                        onToggle={() => {
                                            onUpdateDexEntry({
                                                pokemonSpeciesId: selectedDexEntry.pokemonSpeciesId,
                                                patch: {
                                                    seen: !selectedDexEntry.seen
                                                }
                                            });
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                                            In Living Dex
                                        </span>
                                        <strong className="text-sm font-extrabold uppercase text-gray-400">
                                            No
                                        </strong>
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                                            Caught
                                        </span>
                                        <strong className="text-sm font-extrabold uppercase text-gray-400">
                                            No
                                        </strong>
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                                            Seen
                                        </span>
                                        <strong className="text-sm font-extrabold uppercase text-gray-400">
                                            No
                                        </strong>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4">
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
                </aside>
            </div >
        </>
    );
};
