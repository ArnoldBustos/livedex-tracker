import { useMemo, useState } from "react";
import "./App.css";

type UploadRecord = {
  id: string;
  userId: string;
  originalFilename: string;
  storageProvider: string;
  storageKey: string;
  fileUrl: string | null;
  fileSizeBytes: number;
  parseStatus: string;
  detectedGame: string | null;
  parseError: string | null;
  createdAt: string;
  updatedAt: string;
};

type TrainerInfo = {
  name: string;
  gender: string;
};

type DebugPayload = {
  activeSaveIndex?: number;
  sectionIds?: number[];
  seenNationalDexNumbers?: number[];
  ownedNationalDexNumbers?: number[];
  seenCount?: number;
  ownedCount?: number;
  trainerName?: string;
  trainerGender?: string;
};

type UploadResponse = {
  upload: UploadRecord;
  trainerInfo?: TrainerInfo;
  debug?: DebugPayload;
};

type DexEntry = {
  pokemonSpeciesId: number;
  dexNumber: number;
  name: string;
  generation: number;
  seen: boolean;
  caught: boolean;
  hasLivingEntry: boolean;
};

type DexResponse = {
  summary: {
    totalEntries: number;
    seenCount: number;
    caughtCount: number;
    livingCount: number;
  };
  entries: DexEntry[];
};

type DexFilter = "all" | "living" | "missing" | "seenOnly" | "caughtNotLiving";
type DexScope = "national" | "regional";

type DexDisplayStatus = "living" | "caught" | "seen" | "missing";

const API_BASE_URL = "http://localhost:4000";

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

const App = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [dexResponse, setDexResponse] = useState<DexResponse | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<DexFilter>("all");
  const [selectedScope, setSelectedScope] = useState<DexScope>("national");
  const [selectedDexNumber, setSelectedDexNumber] = useState<number | null>(null);
  const trainerName =
    uploadResponse && uploadResponse.trainerInfo && uploadResponse.trainerInfo.name
      ? uploadResponse.trainerInfo.name
      : uploadResponse && uploadResponse.debug && uploadResponse.debug.trainerName
        ? uploadResponse.debug.trainerName
        : "Unknown Trainer";

  const trainerGender =
    uploadResponse && uploadResponse.trainerInfo && uploadResponse.trainerInfo.gender
      ? uploadResponse.trainerInfo.gender
      : uploadResponse && uploadResponse.debug && uploadResponse.debug.trainerGender
        ? uploadResponse.debug.trainerGender
        : "Unknown";

  const prettyResponse = useMemo(() => {
    if (!uploadResponse) {
      return "";
    }

    return JSON.stringify(uploadResponse, null, 2);
  }, [uploadResponse]);

  const dexEntries = useMemo(() => {
    if (!dexResponse) {
      return [] as DexEntry[];
    }

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files && event.target.files[0] ? event.target.files[0] : null;

    setSelectedFile(nextFile);
    setErrorMessage("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Choose a .sav or .srm file first.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setUploadResponse(null);
    setDexResponse(null);
    setSelectedDexNumber(null);

    try {
      const formData = new FormData();
      formData.append("saveFile", selectedFile);

      const response = await fetch(`${API_BASE_URL}/uploads`, {
        method: "POST",
        body: formData
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || "Upload failed");
      }

      const parsedResponse = JSON.parse(responseText) as UploadResponse;
      setUploadResponse(parsedResponse);

      const uploadedUserId = parsedResponse.upload.userId;

      const dexResponse = await fetch(`${API_BASE_URL}/dex/${uploadedUserId}`);

      if (!dexResponse.ok) {
        throw new Error("Dex fetch failed after upload");
      }

      const parsedDexResponse = await dexResponse.json() as DexResponse;
      setDexResponse(parsedDexResponse);

      if (parsedDexResponse.entries.length > 0) {
        setSelectedDexNumber(parsedDexResponse.entries[0].dexNumber);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unknown upload error");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getPokemonSpriteUrl = (dexNumber: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${dexNumber}.png`;
  };

  const getPokemonArtworkUrl = (dexNumber: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`;
  };

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <h1 className="topbar-title">LiveDex Tracker</h1>
          <span className="topbar-game">
            {uploadResponse?.upload.detectedGame || "Gen 3 Save"}
          </span>
        </div>

        <div className="topbar-actions">
          <input
            className="file-input file-input-hidden"
            id="save-file-input"
            type="file"
            accept=".sav,.srm"
            onChange={handleFileChange}
          />
          <label className="upload-button topbar-upload-button" htmlFor="save-file-input">
            {selectedFile ? selectedFile.name : "Choose Save File"}
          </label>
          <button
            className="upload-button"
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Save"}
          </button>
        </div>
      </header>

      <div className="dashboard-body">
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
                setSelectedFilter("all");
              }}
            >
              All
            </button>
            <button
              className={selectedFilter === "living" ? "sidebar-nav-item active" : "sidebar-nav-item"}
              type="button"
              onClick={() => {
                setSelectedFilter("living");
              }}
            >
              Living
            </button>
            <button
              className={selectedFilter === "missing" ? "sidebar-nav-item active" : "sidebar-nav-item"}
              type="button"
              onClick={() => {
                setSelectedFilter("missing");
              }}
            >
              Missing
            </button>
            <button
              className={selectedFilter === "seenOnly" ? "sidebar-nav-item active" : "sidebar-nav-item"}
              type="button"
              onClick={() => {
                setSelectedFilter("seenOnly");
              }}
            >
              Seen Only
            </button>
            <button
              className={selectedFilter === "caughtNotLiving" ? "sidebar-nav-item active" : "sidebar-nav-item"}
              type="button"
              onClick={() => {
                setSelectedFilter("caughtNotLiving");
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

          {uploadResponse && dexResponse ? (
            <section className="summary-strip">
              <div className="summary-card summary-card-trainer">
                <span className="summary-kicker">Trainer</span>
                <strong className="summary-big">{trainerName}</strong>
                <span className="summary-meta">
                  {uploadResponse.upload.detectedGame || "Unknown Game"}
                </span>
              </div>

              <div className="summary-card">
                <span className="summary-kicker">Caught</span>
                <strong className="summary-big">{dashboardSummary.caughtCount}</strong>
                <span className="summary-meta" aria-hidden="true">
                  Placeholder
                </span>
              </div>

              <div className="summary-card">
                <span className="summary-kicker">Living Dex</span>
                <strong className="summary-big">{dashboardSummary.livingCount}</strong>
                <span className="summary-meta" aria-hidden="true">
                  Placeholder
                </span>
              </div>

              <div className="summary-card">
                <span className="summary-kicker">Missing</span>
                <strong className="summary-big">{dashboardSummary.missingCount}</strong>
                <span className="summary-meta" aria-hidden="true">
                  Placeholder
                </span>
              </div>

              <div className="summary-card">
                <span className="summary-kicker">Seen Only</span>
                <strong className="summary-big">{dashboardSummary.seenOnlyCount}</strong>
                <span className="summary-meta" aria-hidden="true">
                  Placeholder
                </span>
              </div>
            </section>
          ) : (
            <section className="summary-strip summary-strip-empty">
              <div className="summary-empty-card">
                <span className="summary-kicker">LiveDex Tracker</span>
                <strong className="summary-big">Upload a save file</strong>
                <span className="summary-meta">Load a Gen 3 save to view trainer info and dex progress</span>
              </div>
            </section>
          )}

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
                  setSelectedScope("national");
                }}
              >
                National
              </button>
              <button
                className={selectedScope === "regional" ? "scope-toggle-button active" : "scope-toggle-button"}
                type="button"
                onClick={() => {
                  setSelectedScope("regional");
                }}
              >
                Regional
              </button>
            </div>
          </section>

          {uploadResponse ? (
            <section className="dex-grid">
              {filteredDexEntries.map((dexEntry) => {
                const status = getDexEntryStatus(dexEntry);
                const isSelected = selectedDexEntry?.dexNumber === dexEntry.dexNumber;

                return (
                  <button
                    key={dexEntry.dexNumber}
                    className={isSelected ? `${getDexEntryCardClassName(status)} selected` : getDexEntryCardClassName(status)}
                    type="button"
                    onClick={() => {
                      setSelectedDexNumber(dexEntry.dexNumber);
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
          ) : (
            <section className="empty-dashboard-state">
              <h3>Upload a save file</h3>
              <p>
                Choose a Gen 3 save file to load your living dex progress, missing Pokémon,
                and caught status.
              </p>
            </section>
          )}

          {uploadResponse ? (
            <details className="debug-details">
              <summary>Raw Debug Response</summary>
              <pre className="debug-block">{prettyResponse}</pre>
            </details>
          ) : null}
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
                <strong>{selectedDexEntry?.hasLivingEntry ? "Yes" : "No"}</strong>
              </div>
              <div className="inspector-status-row">
                <span>Caught</span>
                <strong>{selectedDexEntry?.caught ? "Yes" : "No"}</strong>
              </div>
              <div className="inspector-status-row">
                <span>Seen</span>
                <strong>{selectedDexEntry?.seen ? "Yes" : "No"}</strong>
              </div>
            </div>

            <div className="inspector-analysis-card">
              <p className="inspector-analysis-label">Collection Analysis</p>
              <div className="inspector-progress-row">
                <span>Total Completion</span>
                <span>
                  {dexEntries.length > 0
                    ? `${Math.round((dashboardSummary.livingCount / dexEntries.length) * 100)}%`
                    : "0%"}
                </span>
              </div>
              <div className="inspector-progress-bar">
                <div
                  className="inspector-progress-fill"
                  style={{
                    width: dexEntries.length > 0
                      ? `${Math.round((dashboardSummary.livingCount / dexEntries.length) * 100)}%`
                      : "0%"
                  }}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default App;