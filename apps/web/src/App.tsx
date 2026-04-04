import { useEffect, useState } from "react";
import "./App.css";
import { EmptyStateView } from "./components/layout/EmptyStateView";
import { LoadedDashboardView } from "./components/layout/LoadedDashboardView";
import { LoginView } from "./components/auth/LoginView";
import type {
  DexFilter,
  DexResponse,
  DexScope,
  SaveProfileRecord,
  UploadResponse
} from "./types/save";
import { deleteSaveProfile } from "./lib/api/uploads";

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
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    username: string;
  } | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // handleLogin submits the email to the backend and sets currentUser on success
  // LoginView calls this when the user presses Sign In
  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: loginEmail.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setCurrentUser(data.user);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Login failed"
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // handleContinueAsGuest bypasses login and allows normal app usage
  // LoginView calls this to enter guest mode
  const handleContinueAsGuest = () => {
    setCurrentUser({
      id: "guest",
      email: "guest",
      username: "Guest"
    });
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const fetchSaveProfiles = async () => {
      try {
        const saveProfilesRequest = await fetch(`${API_BASE_URL}/uploads/profiles`, {
          headers: {
            "x-user-id": currentUser.id,
            "x-user-email": currentUser.email
          }
        });

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
  }, [currentUser]);

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

  const handleUpdateActiveProfileSave = async (file: File) => {
    if (!activeSaveProfileId) {
      setErrorMessage("No active save profile selected.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");

      const formData = new FormData();
      formData.append("saveFile", file);
      formData.append("saveProfileId", activeSaveProfileId);

      const uploadRequest = await fetch(`${API_BASE_URL}/uploads`, {
        method: "POST",
        body: formData
      });

      const uploadResponseText = await uploadRequest.text();

      if (!uploadRequest.ok) {
        throw new Error(uploadResponseText || "Upload failed");
      }

      const nextUploadResponse = JSON.parse(uploadResponseText) as UploadResponse;
      const saveProfileId = nextUploadResponse.saveProfile.id;

      const dexRequest = await fetch(`${API_BASE_URL}/dex/profile/${saveProfileId}`);

      if (!dexRequest.ok) {
        throw new Error("Dex fetch failed after upload");
      }

      const nextDexResponse = await dexRequest.json() as DexResponse;

      handleUploadSuccess(nextUploadResponse, nextDexResponse);
    } catch (error) {
      console.error("Failed to update active save profile", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update save"
      );
      setIsUploading(false);
    }
  };

  const handleSelectSaveProfile = async (saveProfileId: string) => {
    if (saveProfileId === activeSaveProfileId) {
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");

      const saveProfileRequest = await fetch(
        `${API_BASE_URL}/uploads/profiles/${saveProfileId}`
      );
      const dexRequest = await fetch(
        `${API_BASE_URL}/dex/profile/${saveProfileId}`
      );

      if (!saveProfileRequest.ok) {
        const errorPayload = await saveProfileRequest.json() as { error?: string };
        throw new Error(errorPayload.error || "Failed to load save profile");
      }

      if (!dexRequest.ok) {
        throw new Error("Failed to load dex data");
      }

      const nextUploadResponse = await saveProfileRequest.json() as UploadResponse;
      const nextDexResponse = await dexRequest.json() as DexResponse;

      setUploadResponse(nextUploadResponse);
      setDexResponse(nextDexResponse);
      setActiveSaveProfileId(saveProfileId);
      setSelectedFilter("all");
      setSelectedScope("national");

      if (nextDexResponse.entries.length > 0) {
        setSelectedDexNumber(nextDexResponse.entries[0].dexNumber);
      } else {
        setSelectedDexNumber(null);
      }
    } catch (error) {
      console.error("Failed to switch save profile", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to switch save profile"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // handleDeleteProfile removes a profile and updates global state
  // LoadedDashboardView calls this after the user confirms profile deletion
  const handleDeleteProfile = async (saveProfileId: string) => {
    try {
      await deleteSaveProfile(saveProfileId);

      setSaveProfiles((currentSaveProfiles) => {
        const nextSaveProfiles = currentSaveProfiles.filter((saveProfile) => {
          return saveProfile.id !== saveProfileId;
        });

        setActiveSaveProfileId((currentActiveSaveProfileId) => {
          if (currentActiveSaveProfileId !== saveProfileId) {
            return currentActiveSaveProfileId;
          }

          return nextSaveProfiles.length > 0 ? nextSaveProfiles[0].id : null;
        });

        if (activeSaveProfileId === saveProfileId && nextSaveProfiles.length === 0) {
          setUploadResponse(null);
          setDexResponse(null);
          setSelectedDexNumber(null);
          setSelectedFilter("all");
          setSelectedScope("national");
        }

        return nextSaveProfiles;
      });

      setErrorMessage("");
    } catch (error) {
      console.error("Failed to delete save profile", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete save profile"
      );
    }
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

  if (!currentUser) {
    return (
      <LoginView
        email={loginEmail}
        isSubmitting={isLoggingIn}
        errorMessage={errorMessage}
        onChangeEmail={setLoginEmail}
        onSubmit={handleLogin}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  }

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
        onSelectSaveProfile={handleSelectSaveProfile}
        onUpdateSave={handleUpdateActiveProfileSave}
        onResetToEmptyState={handleResetToEmptyState}
        onDeleteProfile={handleDeleteProfile}
      />
    </div>
  );
};

export default App;