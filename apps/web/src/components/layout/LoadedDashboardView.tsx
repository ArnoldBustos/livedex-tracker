import { useMemo } from "react";
import { DashboardTopbar } from "../dashboard/DashboardTopbar";
import { DashboardSummary } from "../dashboard/DashboardSummary";
import type {
    DexDisplayStatus,
    DexEntry,
    DexFilter,
    DexResponse,
    DexScope,
    UploadResponse
} from "../../types/save";

type LoadedDashboardViewProps = {
    uploadResponse: UploadResponse;
    dexResponse: DexResponse;
    selectedFilter: DexFilter;
    selectedScope: DexScope;
    selectedDexNumber: number | null;
    errorMessage: string;
    isUploading: boolean;
    onChangeFilter: (nextFilter: DexFilter) => void;
    onChangeScope: (nextScope: DexScope) => void;
    onSelectDexNumber: (nextDexNumber: number) => void;
    onResetToEmptyState: () => void;
};

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

const getDexEntryCardClassName = (status: DexDisplayStatus) => {
    if (status === "living") {
        return "dex-grid-card dex-grid-card-living";
    }

    if (status === "caught") {
        return "dex-grid-card dex-grid-card-caught";
    }

    if (status === "seen") {
        return "dex-grid-card dex-grid-card-seen";
    }

    return "dex-grid-card dex-grid-card-missing";
};

const getPokemonSpriteUrl = (dexNumber: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${dexNumber}.png`;
};

const getPokemonArtworkUrl = (dexNumber: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`;
};

export const LoadedDashboardView = ({
    uploadResponse,
    dexResponse,
    selectedFilter,
    selectedScope,
    selectedDexNumber,
    errorMessage,
    isUploading,
    onChangeFilter,
    onChangeScope,
    onSelectDexNumber,
    onResetToEmptyState
}: LoadedDashboardViewProps) => {
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
        if (selectedScope === "regional") {
            return dexResponse.entries.filter((dexEntry) => {
                return dexEntry.generation <= 3;
            });
        }

        return dexResponse.entries;
    }, [dexResponse, selectedScope]);

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
                onReset={onResetToEmptyState}
            />

            <div className="grid grid-cols-[260px_1fr_320px] gap-6 px-6 py-6">
                <aside className="sidebar">
                    <div className="sidebar-card">
                        <div className="sidebar-trainer-name">{trainerName}</div>
                        <div className="sidebar-trainer-meta">
                            {trainerGender === "Unknown" ? "Active Trainer" : `${trainerGender} trainer`}
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <button
                            className={selectedFilter === "all" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                            type="button"
                            onClick={() => {
                                onChangeFilter("all");
                            }}
                        >
                            All
                        </button>
                        <button
                            className={selectedFilter === "living" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                            type="button"
                            onClick={() => {
                                onChangeFilter("living");
                            }}
                        >
                            Living
                        </button>
                        <button
                            className={selectedFilter === "missing" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                            type="button"
                            onClick={() => {
                                onChangeFilter("missing");
                            }}
                        >
                            Missing
                        </button>
                        <button
                            className={selectedFilter === "seenOnly" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                            type="button"
                            onClick={() => {
                                onChangeFilter("seenOnly");
                            }}
                        >
                            Seen Only
                        </button>
                        <button
                            className={selectedFilter === "caughtNotLiving" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                            type="button"
                            onClick={() => {
                                onChangeFilter("caughtNotLiving");
                            }}
                        >
                            Caught Not Living
                        </button>
                    </nav>

                    <div className="sidebar-footer">
                        <button className="sidebar-report-button" type="button">
                            Generate Report
                        </button>
                    </div>
                </aside>

                <main className="dashboard-main">
                    {errorMessage ? (
                        <div className="message error-message">{errorMessage}</div>
                    ) : null}

                    <DashboardSummary
                        trainerName={trainerName}
                        gameLabel={uploadResponse.upload.detectedGame || "Unknown Game"}
                        caughtCount={dashboardSummary.caughtCount}
                        livingCount={dashboardSummary.livingCount}
                        missingCount={dashboardSummary.missingCount}
                        seenOnlyCount={dashboardSummary.seenOnlyCount}
                    />

                    <section className="dex-header">
                        <div>
                            <p className="dex-header-kicker">Database View</p>
                            <h2 className="dex-header-title">
                                {selectedScope === "national" ? "National Dex" : "Regional Dex"}
                            </h2>
                        </div>

                        <div className="scope-toggle">
                            <button
                                className={selectedScope === "national" ? "scope-toggle-button active" : "scope-toggle-button"}
                                type="button"
                                onClick={() => {
                                    onChangeScope("national");
                                }}
                            >
                                National
                            </button>
                            <button
                                className={selectedScope === "regional" ? "scope-toggle-button active" : "scope-toggle-button"}
                                type="button"
                                onClick={() => {
                                    onChangeScope("regional");
                                }}
                            >
                                Regional
                            </button>
                        </div>
                    </section>

                    <section className="dex-grid">
                        {filteredDexEntries.map((dexEntry) => {
                            const status = getDexEntryStatus(dexEntry);
                            const isSelected = selectedDexEntry
                                ? selectedDexEntry.dexNumber === dexEntry.dexNumber
                                : false;

                            return (
                                <button
                                    key={dexEntry.dexNumber}
                                    className={isSelected ? `${getDexEntryCardClassName(status)} selected` : getDexEntryCardClassName(status)}
                                    type="button"
                                    onClick={() => {
                                        onSelectDexNumber(dexEntry.dexNumber);
                                    }}
                                >
                                    <div className="dex-grid-card-top">
                                        <span className="dex-grid-number">
                                            #{dexEntry.dexNumber.toString().padStart(3, "0")}
                                        </span>
                                        <span className="dex-grid-status-chip">
                                            {getDexEntryStatusLabel(status)}
                                        </span>
                                    </div>

                                    <div className="dex-grid-sprite">
                                        {status === "missing" ? (
                                            "?"
                                        ) : (
                                            <img
                                                src={getPokemonSpriteUrl(dexEntry.dexNumber)}
                                                alt={dexEntry.name}
                                                className="dex-grid-sprite-image"
                                            />
                                        )}
                                    </div>

                                    <div className="dex-grid-name">
                                        {dexEntry.name}
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

                <aside className="inspector">
                    <div className="inspector-hero">
                        <div className="inspector-avatar">
                            {selectedDexEntry ? (
                                <img
                                    src={getPokemonArtworkUrl(selectedDexEntry.dexNumber)}
                                    alt={selectedDexEntry.name}
                                    className="inspector-avatar-image"
                                />
                            ) : (
                                "?"
                            )}
                        </div>
                    </div>

                    <div className="inspector-body">
                        <p className="inspector-kicker">
                            {selectedDexEntry
                                ? `Dex No. ${selectedDexEntry.dexNumber.toString().padStart(3, "0")}`
                                : "No Selection"}
                        </p>

                        <h3 className="inspector-title">
                            {selectedDexEntry ? selectedDexEntry.name : "Choose a Pokémon"}
                        </h3>

                        <div className="inspector-status-list">
                            <div className="inspector-status-row">
                                <span>Living Dex</span>
                                <strong>{selectedDexEntry && selectedDexEntry.hasLivingEntry ? "Yes" : "No"}</strong>
                            </div>
                            <div className="inspector-status-row">
                                <span>Caught</span>
                                <strong>{selectedDexEntry && selectedDexEntry.caught ? "Yes" : "No"}</strong>
                            </div>
                            <div className="inspector-status-row">
                                <span>Seen</span>
                                <strong>{selectedDexEntry && selectedDexEntry.seen ? "Yes" : "No"}</strong>
                            </div>
                        </div>

                        <div className="inspector-analysis-card">
                            <p className="inspector-analysis-label">Collection Analysis</p>
                            <div className="inspector-progress-row">
                                <span>Total Completion</span>
                                <span>{completionPercentage}%</span>
                            </div>
                            <div className="inspector-progress-bar">
                                <div
                                    className="inspector-progress-fill"
                                    style={{
                                        width: `${completionPercentage}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
};