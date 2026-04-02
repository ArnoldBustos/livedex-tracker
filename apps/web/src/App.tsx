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

type DebugPayload = {
  activeSaveIndex?: number;
  sectionIds?: number[];
  seenNationalDexNumbers?: number[];
  ownedNationalDexNumbers?: number[];
  seenCount?: number;
  ownedCount?: number;
};

type UploadResponse = {
  upload: UploadRecord;
  debug?: DebugPayload;
};

const API_BASE_URL = "http://localhost:4000";

const App = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);

  const prettyResponse = useMemo(() => {
    if (!uploadResponse) {
      return "";
    }

    return JSON.stringify(uploadResponse, null, 2);
  }, [uploadResponse]);

  const parsedSummary = useMemo(() => {
    if (!uploadResponse || !uploadResponse.debug) {
      return {
        seenCount: 0,
        ownedCount: 0,
        seenPreview: [] as number[],
        ownedPreview: [] as number[]
      };
    }

    const seenNationalDexNumbers = uploadResponse.debug.seenNationalDexNumbers || [];
    const ownedNationalDexNumbers = uploadResponse.debug.ownedNationalDexNumbers || [];

    return {
      seenCount: uploadResponse.debug.seenCount || seenNationalDexNumbers.length,
      ownedCount: uploadResponse.debug.ownedCount || ownedNationalDexNumbers.length,
      seenPreview: seenNationalDexNumbers.slice(0, 24),
      ownedPreview: ownedNationalDexNumbers.slice(0, 24)
    };
  }, [uploadResponse]);

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

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Gen 3 MVP</p>
        <h1 className="hero-title">LiveDex Tracker</h1>
        <p className="hero-copy">
          Upload a Gen 3 save file and inspect parsed Pokédex progress from the backend.
        </p>
      </section>

      <section className="upload-panel">
        <div className="panel-header">
          <h2>Save Upload</h2>
          <p>Local upload test page for Gen 3 parsing and Pokédex progress checks.</p>
        </div>

        <div className="upload-controls">
          <input
            className="file-input"
            type="file"
            accept=".sav,.srm"
            onChange={handleFileChange}
          />
          <button
            className="upload-button"
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Save"}
          </button>
        </div>

        <div className="status-row">
          <span className="status-label">Selected file</span>
          <span className="status-value">
            {selectedFile ? selectedFile.name : "None"}
          </span>
        </div>

        {errorMessage ? (
          <div className="message error-message">{errorMessage}</div>
        ) : null}

        {uploadResponse ? (
          <div className="result-stack">
            <div className="result-card">
              <h3>Upload Summary</h3>
              <dl className="summary-grid">
                <div>
                  <dt>Status</dt>
                  <dd>{uploadResponse.upload.parseStatus}</dd>
                </div>
                <div>
                  <dt>Detected Game</dt>
                  <dd>{uploadResponse.upload.detectedGame || "None"}</dd>
                </div>
                <div>
                  <dt>Filename</dt>
                  <dd>{uploadResponse.upload.originalFilename}</dd>
                </div>
                <div>
                  <dt>File Size</dt>
                  <dd>{uploadResponse.upload.fileSizeBytes.toLocaleString()} bytes</dd>
                </div>
                <div>
                  <dt>Parse Error</dt>
                  <dd>{uploadResponse.upload.parseError || "None"}</dd>
                </div>
                <div>
                  <dt>Upload ID</dt>
                  <dd>{uploadResponse.upload.id}</dd>
                </div>
              </dl>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Seen</span>
                <strong className="stat-value">{parsedSummary.seenCount}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Caught</span>
                <strong className="stat-value">{parsedSummary.ownedCount}</strong>
              </div>
            </div>

            <div className="result-card">
              <h3>Seen Preview</h3>
              {parsedSummary.seenPreview.length > 0 ? (
                <div className="dex-chip-list">
                  {parsedSummary.seenPreview.map((dexNumber) => {
                    return (
                      <span key={`seen-${dexNumber}`} className="dex-chip">
                        #{dexNumber}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="empty-copy">No seen entries found.</p>
              )}
            </div>

            <div className="result-card">
              <h3>Caught Preview</h3>
              {parsedSummary.ownedPreview.length > 0 ? (
                <div className="dex-chip-list">
                  {parsedSummary.ownedPreview.map((dexNumber) => {
                    return (
                      <span key={`owned-${dexNumber}`} className="dex-chip dex-chip-caught">
                        #{dexNumber}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="empty-copy">No caught entries found.</p>
              )}
            </div>

            <details className="debug-details">
              <summary>Raw Debug Response</summary>
              <pre className="debug-block">{prettyResponse}</pre>
            </details>
          </div>
        ) : null}
      </section>
    </main>
  );
};

export default App;