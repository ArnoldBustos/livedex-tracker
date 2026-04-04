import { useEffect, useState } from "react"; // React hooks used throughout App

import "./App.css";

import { EmptyStateView } from "./components/layout/EmptyStateView"; // empty upload screen
import { LoadedDashboardView } from "./components/layout/LoadedDashboardView"; // main dashboard
import { LoginView } from "./components/auth/LoginView"; // login / guest entry screen

import type {
  DexFilter,
  DexResponse,
  DexScope,
  GuestDexOverrideMap,
  SaveProfileRecord,
  UpdateDexEntryRequest,
  UploadResponse
} from "./types/save"; // shared frontend types for dex + uploads
import { patchDexEntryOverride } from "./lib/api/dex";

import {
  deleteSaveProfile,
  fetchDexBySaveProfileId,
  fetchSaveProfileById,
  fetchSaveProfiles,
  loginWithEmail,
  uploadSaveAndFetchDex,
} from "./lib/api/uploads"; // API layer for backend requests

import {
  clearStoredUser,
  restoreSession,
  saveStoredUser
} from "./lib/auth/session"; // session persistence helpers for auth and guest mode
import type { StoredUser } from "./lib/auth/session"; // persisted frontend user shape

type SessionMode = "auth" | "user" | "guest";
type AuthMode = "login" | "register";

const App = () => {
  const restoredSession = restoreSession();

  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [dexResponse, setDexResponse] = useState<DexResponse | null>(null);
  const [guestDexOverrides, setGuestDexOverrides] = useState<GuestDexOverrideMap>({});
  const [saveProfiles, setSaveProfiles] = useState<SaveProfileRecord[]>([]);
  const [activeSaveProfileId, setActiveSaveProfileId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<DexFilter>("all");
  const [selectedScope, setSelectedScope] = useState<DexScope>("national");
  const [selectedDexNumber, setSelectedDexNumber] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(restoredSession.user);
  const [sessionMode, setSessionMode] = useState<SessionMode>(restoredSession.mode);
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const isGuestMode = sessionMode === "guest";

  // buildDexSummary recalculates summary totals from a dex entry list.
  // guest merged dex state uses this so frontend-only overrides stay consistent with the sidebar and cards.
  const buildDexSummary = (entries: DexResponse["entries"]) => {
    return {
      totalEntries: entries.length,
      seenCount: entries.filter((entry) => {
        return entry.seen;
      }).length,
      caughtCount: entries.filter((entry) => {
        return entry.caught;
      }).length,
      livingCount: entries.filter((entry) => {
        return entry.hasLivingEntry;
      }).length
    };
  };

  // getMergedGuestDexResponse overlays guest local manual edits on top of imported guest dex data.
  // App.tsx uses this so guest mode can edit dex state without calling the backend.
  const getMergedGuestDexResponse = (
    baseDexResponse: DexResponse,
    overrides: GuestDexOverrideMap
  ): DexResponse => {
    const mergedEntries = baseDexResponse.entries.map((entry) => {
      const override = overrides[entry.pokemonSpeciesId];

      if (!override) {
        return entry;
      }

      const nextEntry = Object.assign({}, entry);

      if (typeof override.seen === "boolean") {
        nextEntry.seen = override.seen;
      }

      if (typeof override.caught === "boolean") {
        nextEntry.caught = override.caught;
      }

      if (typeof override.hasLivingEntry === "boolean") {
        nextEntry.hasLivingEntry = override.hasLivingEntry;
      }

      return nextEntry;
    });

    return {
      summary: buildDexSummary(mergedEntries),
      entries: mergedEntries
    };
  };

  // displayedDexResponse chooses the backend dex for signed-in users and the locally merged dex for guests.
  // App.tsx passes this into LoadedDashboardView so both modes render through one dashboard path.
  const displayedDexResponse =
    dexResponse && isGuestMode
      ? getMergedGuestDexResponse(dexResponse, guestDexOverrides)
      : dexResponse;

  // handleLogin submits the email to the backend and enters signed-in account mode on success
  // LoginView calls this when the user presses Sign In
  // handleLogin submits the email to the backend and enters signed-in account mode on success
  // LoginView calls this when the user presses Sign In or the current auth action button
  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setErrorMessage("");

      const loginResponse = await loginWithEmail(loginEmail.trim());
      setCurrentUser(loginResponse.user);
      setSessionMode("user");
      setAuthMode("login");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Login failed"
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // handleContinueAsGuest creates a guest session and switches the app into guest mode
  // LoginView calls this to enter guest mode without account-backed persistence
  const handleContinueAsGuest = () => {
    setCurrentUser({
      id: "guest",
      email: "guest",
      username: "Guest"
    });
    setSessionMode("guest");
  };

  // Persists the current user session only when the app is in user or guest mode
  // App startup, login, guest entry, and logout all flow through this so storage stays in sync with sessionMode
  useEffect(() => {
    if (sessionMode === "auth" || !currentUser) {
      clearStoredUser();
      return;
    }

    saveStoredUser(currentUser);
  }, [currentUser, sessionMode]);

  useEffect(() => {
    if (!currentUser || sessionMode !== "user") {
      setSaveProfiles([]);
      setActiveSaveProfileId(null);
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
  }, [currentUser, sessionMode]);

  const handleUploadStart = () => {
    setIsUploading(true);
    setErrorMessage("");
    setUploadResponse(null);
    setDexResponse(null);
    setGuestDexOverrides({});
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
    setGuestDexOverrides({});
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

      const { uploadResponse: nextUploadResponse, dexResponse: nextDexResponse } =
        await uploadSaveAndFetchDex(formData, currentUser);

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
      const nextDexResponse = nextUploadResponse.dex ?? await fetchDexBySaveProfileId(saveProfileId, currentUser);

      setUploadResponse(nextUploadResponse);
      setDexResponse(nextDexResponse);
      setGuestDexOverrides({});
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
          setGuestDexOverrides({});
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

  // handleUpdateDexEntry applies one manual dex edit for the selected pokemon.
  // signed-in mode persists through the backend, while guest mode stores a frontend-only override.
  const handleUpdateDexEntry = async ({
    pokemonSpeciesId,
    patch
  }: {
    pokemonSpeciesId: number;
    patch: UpdateDexEntryRequest;
  }) => {
    if (!dexResponse) {
      setErrorMessage("No dex data is currently loaded.");
      return;
    }

    if (isGuestMode) {
      setGuestDexOverrides((currentOverrides) => {
        const currentOverride = currentOverrides[pokemonSpeciesId];
        const nextOverride = currentOverride ? Object.assign({}, currentOverride) : {};

        if (Object.prototype.hasOwnProperty.call(patch, "seen")) {
          if (patch.seen === null) {
            delete nextOverride.seen;
          } else {
            nextOverride.seen = patch.seen;
          }
        }

        if (Object.prototype.hasOwnProperty.call(patch, "caught")) {
          if (patch.caught === null) {
            delete nextOverride.caught;
          } else {
            nextOverride.caught = patch.caught;
          }
        }

        if (Object.prototype.hasOwnProperty.call(patch, "hasLivingEntry")) {
          if (patch.hasLivingEntry === null) {
            delete nextOverride.hasLivingEntry;
          } else {
            nextOverride.hasLivingEntry = patch.hasLivingEntry;
          }
        }

        const nextOverrides = Object.assign({}, currentOverrides);

        if (
          typeof nextOverride.seen !== "boolean" &&
          typeof nextOverride.caught !== "boolean" &&
          typeof nextOverride.hasLivingEntry !== "boolean"
        ) {
          delete nextOverrides[pokemonSpeciesId];
          return nextOverrides;
        }

        nextOverrides[pokemonSpeciesId] = nextOverride;
        return nextOverrides;
      });

      setErrorMessage("");
      return;
    }

    if (!currentUser || !activeSaveProfileId) {
      setErrorMessage("No signed-in save profile is selected.");
      return;
    }

    try {
      setErrorMessage("");

      const nextDexResponse = await patchDexEntryOverride({
        saveProfileId: activeSaveProfileId,
        pokemonSpeciesId,
        patch,
        currentUser
      });

      setDexResponse(nextDexResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update dex entry"
      );
    }
  };

  // resetDashboardState clears loaded profile and dex state without removing auth
  // logout and empty-state transitions both call this so reset logic stays centralized
  const resetDashboardState = () => {
    setUploadResponse(null);
    setDexResponse(null);
    setGuestDexOverrides({});
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

  // handleGoToLogin clears any temporary session and returns the app to login mode
  // Guest CTA buttons call this so guest sessions can transition into the auth flow
  const handleGoToLogin = () => {
    clearStoredUser();
    resetDashboardState();
    setCurrentUser(null);
    setSessionMode("auth");
    setAuthMode("login");
    setErrorMessage("");
  };

  // handleGoToRegister clears any temporary session and returns the app to register mode
  // Guest CTA buttons call this so guest sessions can transition into account creation flow
  const handleGoToRegister = () => {
    clearStoredUser();
    resetDashboardState();
    setCurrentUser(null);
    setSessionMode("auth");
    setAuthMode("register");
    setErrorMessage("");
  };

  // handleLogout clears persisted auth, guest state, and loaded dashboard state
  // LoadedDashboardView calls this so the app always returns to the auth screen after logout
  const handleLogout = () => {
    clearStoredUser();
    setLoginEmail("");
    resetDashboardState();
    setCurrentUser(null);
    setSessionMode("auth");
  };

  if (sessionMode === "auth" || !currentUser) {
    return (
      <LoginView
        authMode={authMode}
        email={loginEmail}
        isSubmitting={isLoggingIn}
        errorMessage={errorMessage}
        onChangeEmail={setLoginEmail}
        onSubmit={handleLogin}
        onContinueAsGuest={handleContinueAsGuest}
        onSwitchToLogin={() => {
          setAuthMode("login");
          setErrorMessage("");
        }}
        onSwitchToRegister={() => {
          setAuthMode("register");
          setErrorMessage("");
        }}
      />
    );
  }

  if (!uploadResponse || !displayedDexResponse) {
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

  const sessionLabel = isGuestMode
    ? "Temporary local session"
    : currentUser.email;

  return (
    <div className="min-h-screen bg-[#f6f5dc] text-[#38392a]">
      <LoadedDashboardView
        uploadResponse={uploadResponse}
        dexResponse={displayedDexResponse}
        saveProfiles={saveProfiles}
        activeSaveProfileId={activeSaveProfileId}
        selectedFilter={selectedFilter}
        selectedScope={selectedScope}
        selectedDexNumber={selectedDexNumber}
        errorMessage={errorMessage}
        isUploading={isUploading}
        isGuestMode={isGuestMode}
        sessionLabel={sessionLabel}
        onChangeFilter={setSelectedFilter}
        onChangeScope={setSelectedScope}
        onSelectDexNumber={setSelectedDexNumber}
        onSelectSaveProfile={handleSelectSaveProfile}
        onUpdateSave={handleUpdateActiveProfileSave}
        onUpdateDexEntry={handleUpdateDexEntry}
        onResetToEmptyState={handleResetToEmptyState}
        onDeleteProfile={handleDeleteProfile}
        onLogout={handleLogout}
        onGoToLogin={handleGoToLogin}
        onGoToRegister={handleGoToRegister}
      />
    </div>
  );
};


export default App;
