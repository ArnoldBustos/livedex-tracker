import { useEffect, useState } from "react";
import "./App.css";
import { EmptyStateView } from "./components/layout/EmptyStateView";
import { LoadedDashboardView } from "./components/layout/LoadedDashboardView";
import type {
  DexFilter,
  DexResponse,
  DexScope,
  SaveProfileRecord,
  UploadResponse
} from "./types/save";

const API_BASE_URL = "http://localhost:4000";

const App = () => {
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [dexResponse, setDexResponse] = useState<DexResponse | null>(null);
  const [saveProfiles, setSaveProfiles] = useState<SaveProfileRecord[]>([]);
  const [activeSaveProfileId, setActiveSaveProfileId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<DexFilter>("all");
  const [selectedScope, setSelectedScope] = useState<DexScope>("national");
  const [selectedDexNumber, setSelectedDexNumber] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchSaveProfiles = async () => {
      try {
        const saveProfilesRequest = await fetch(`${API_BASE_URL}/uploads/profiles`);

        if (!saveProfilesRequest.ok) {
          return;
        }

        const parsedSaveProfiles = await saveProfilesRequest.json() as SaveProfileRecord[];
        setSaveProfiles(parsedSaveProfiles);
      } catch (error) {
        console.error("Failed to fetch save profiles", error);
      }
    };

    fetchSaveProfiles();
  }, []);

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
    setActiveSaveProfileId(nextUploadResponse.saveProfile.id);

    setSaveProfiles((currentSaveProfiles) => {
      const existingProfileIndex = currentSaveProfiles.findIndex((saveProfile) => {
        return saveProfile.id === nextUploadResponse.saveProfile.id;
      });

      if (existingProfileIndex === -1) {
        return [nextUploadResponse.saveProfile, ...currentSaveProfiles];
      }

      return currentSaveProfiles.map((saveProfile) => {
        if (saveProfile.id === nextUploadResponse.saveProfile.id) {
          return nextUploadResponse.saveProfile;
        }

        return saveProfile;
      });
    });

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
      <div className="min-h-screen bg-[#f6f5dc] text-[#38392a]">
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
    <div className="min-h-screen bg-[#f6f5dc] text-[#38392a]">
      <LoadedDashboardView
        uploadResponse={uploadResponse}
        dexResponse={dexResponse}
        saveProfiles={saveProfiles}
        activeSaveProfileId={activeSaveProfileId}
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