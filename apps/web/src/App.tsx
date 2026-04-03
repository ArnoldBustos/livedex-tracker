import { useState } from "react";
import "./App.css";
import { EmptyStateView } from "./components/layout/EmptyStateView";
import { LoadedDashboardView } from "./components/layout/LoadedDashboardView";
import type { DexFilter, DexResponse, DexScope, UploadResponse } from "./types/save";

const App = () => {
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [dexResponse, setDexResponse] = useState<DexResponse | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<DexFilter>("all");
  const [selectedScope, setSelectedScope] = useState<DexScope>("national");
  const [selectedDexNumber, setSelectedDexNumber] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUploadStart = () => {
    setIsUploading(true);
    setErrorMessage("");
    setUploadResponse(null);
    setDexResponse(null);
    setSelectedDexNumber(null);
    setSelectedFilter("all");
    setSelectedScope("national");
  };

  const handleUploadSuccess = (
    nextUploadResponse: UploadResponse,
    nextDexResponse: DexResponse
  ) => {
    setUploadResponse(nextUploadResponse);
    setDexResponse(nextDexResponse);

    if (nextDexResponse.entries.length > 0) {
      setSelectedDexNumber(nextDexResponse.entries[0].dexNumber);
    } else {
      setSelectedDexNumber(null);
    }

    setIsUploading(false);
    setErrorMessage("");
  };

  const handleUploadError = (nextErrorMessage: string) => {
    setIsUploading(false);
    setErrorMessage(nextErrorMessage);
  };

  const handleResetToEmptyState = () => {
    setUploadResponse(null);
    setDexResponse(null);
    setSelectedDexNumber(null);
    setSelectedFilter("all");
    setSelectedScope("national");
    setIsUploading(false);
    setErrorMessage("");
  };

  if (!uploadResponse || !dexResponse) {
    return (
      <div className="dashboard-shell">
        <EmptyStateView
          isUploading={isUploading}
          errorMessage={errorMessage}
          onUploadStart={handleUploadStart}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <LoadedDashboardView
        uploadResponse={uploadResponse}
        dexResponse={dexResponse}
        selectedFilter={selectedFilter}
        selectedScope={selectedScope}
        selectedDexNumber={selectedDexNumber}
        errorMessage={errorMessage}
        isUploading={isUploading}
        onChangeFilter={setSelectedFilter}
        onChangeScope={setSelectedScope}
        onSelectDexNumber={setSelectedDexNumber}
        onResetToEmptyState={handleResetToEmptyState}
      />
    </div>
  );
};

export default App;