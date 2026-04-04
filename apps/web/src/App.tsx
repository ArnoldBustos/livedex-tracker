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
import {
  deleteSaveProfile,
  fetchDexBySaveProfileId,
  fetchSaveProfileById,
  fetchSaveProfiles,
  loginWithEmail,
  uploadSaveAndFetchDex,
  uploadSaveFile
} from "./lib/api/uploads";
import { clearStoredUser, loadStoredUser, saveStoredUser } from "./lib/auth/session";

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
  } | null>(() => {
    return loadStoredUser();
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // handleLogin submits the email to the backend and sets currentUser on success
  // LoginView calls this when the user presses Sign In
  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setErrorMessage("");

      const loginResponse = await loginWithEmail(loginEmail.trim());
      setCurrentUser(loginResponse.user);
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
      clearStoredUser();
      return;
    }

    saveStoredUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const loadSaveProfiles = async () => {
      try {
        const parsedSaveProfiles = await fetchSaveProfiles(currentUser);
        setSaveProfiles(parsedSaveProfiles);
      } catch (error) {
        console.error("Failed to fetch save profiles", error);
      }
    };

    loadSaveProfiles();
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

  // handleCreateSaveUpload owns the empty-state upload flow for signed-in or guest users
  // EmptyStateView calls this through UploadHero so upload networking stays out of UI components
  const handleCreateSaveUpload = async (
    file: File,
    saveProfileName: string
  ) => {
    if (!currentUser) {
      throw new Error("No user is currently signed in.");
    }

    const formData = new FormData();
    formData.append("saveFile", file);

    if (saveProfileName) {
      formData.append("saveProfileName", saveProfileName);
    }

    const { uploadResponse: nextUploadResponse, dexResponse: nextDexResponse } =
      await uploadSaveAndFetchDex(formData, currentUser);

    handleUploadSuccess(nextUploadResponse, nextDexResponse);
  };

  const handleUpdateActiveProfileSave = async (file: File) => {
    if (!activeSaveProfileId) {
      setErrorMessage("No active save profile selected.");
      return;
    }

    if (!currentUser) {
      setErrorMessage("No user is currently signed in.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");

      const formData = new FormData();
      formData.append("saveFile", file);
      formData.append("saveProfileId", activeSaveProfileId);

      const nextUploadResponse = await uploadSaveFile(formData, currentUser);
      const saveProfileId = nextUploadResponse.saveProfile.id;
      const nextDexResponse = await fetchDexBySaveProfileId(saveProfileId, currentUser);

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

    if (!currentUser) {
      setErrorMessage("No user is currently signed in.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");

      const nextUploadResponse = await fetchSaveProfileById(saveProfileId, currentUser);
      const nextDexResponse = await fetchDexBySaveProfileId(saveProfileId, currentUser);

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
    if (!currentUser) {
      setErrorMessage("No user is currently signed in.");
      return;
    }

    try {
      await deleteSaveProfile(saveProfileId, currentUser);

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

  // resetDashboardState clears loaded profile and dex state without removing auth
  // logout and empty-state transitions both call this so reset logic stays centralized
  const resetDashboardState = () => {
    setUploadResponse(null);
    setDexResponse(null);
    setSaveProfiles([]);
    setActiveSaveProfileId(null);
    setSelectedDexNumber(null);
    setSelectedFilter("all");
    setSelectedScope("national");
    setIsUploading(false);
    setErrorMessage("");
  };

  // handleResetToEmptyState clears dashboard data but keeps the current signed-in user
  // LoadedDashboardView calls this when returning to the empty upload state
  const handleResetToEmptyState = () => {
    resetDashboardState();
  };

  // handleLogout clears persisted auth and all loaded app state
  // dashboard-level UI will call this when the user chooses to sign out
  const handleLogout = () => {
    clearStoredUser();
    setLoginEmail("");
    resetDashboardState();
    setCurrentUser(null);
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
          onUploadFile={handleCreateSaveUpload}
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
        onLogout={handleLogout}
      />
    </div>
  );
};

export default App;