import { useEffect, useState } from "react"; // React hooks used throughout App

import "./App.css";

import { EmptyStateView } from "./components/layout/EmptyStateView"; // empty upload screen
import { LoadedDashboardView } from "./components/layout/LoadedDashboardView"; // main dashboard
import { LoginView } from "./components/auth/LoginView"; // login / guest entry screen
import { ManualGameOverridePrompt } from "./components/upload/ManualGameOverridePrompt"; // FRLG manual title chooser
import { SaveDetailsForm } from "./components/upload/SaveDetailsForm"; // shared save setup dialog

import type {
  DexCollectionLayerKey,
  DexFilter,
  DexGridDensity,
  DexResponse,
  DexScope,
  EditableSaveIdentity,
  GuestDexOverrideMap,
  ManualGen3GameOverride,
  SaveProfileRecord,
  UpdateSaveProfileRequest,
  UpdateDexEntryRequest,
  UploadManualGameSelectionRequirement,
  UploadRequestFields,
  UploadResponse
} from "./types/save"; // shared frontend types for dex + uploads
import { fetchDexTemplate, patchDexEntryOverride } from "./lib/api/dex";

import {
  deleteSaveProfile,
  fetchDexBySaveProfileId,
  fetchSaveProfileById,
  fetchSaveProfiles,
  loginWithEmail,
  buildUploadSaveFormData,
  updateSaveProfileMetadata,
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

// PendingManualGameSelection stores one paused upload that needs FireRed or LeafGreen before completion.
// App.tsx uses this so both new uploads and active-profile replacements can resume through one path.
type PendingManualGameSelection = {
  file: File;
  requestFields: UploadRequestFields;
  requirement: UploadManualGameSelectionRequirement;
};

// PendingSaveSetup stores one in-progress save identity flow before upload or manual shell creation completes.
// App.tsx uses this so upload and manual entry can share the same setup dialog and payload shape.
type PendingSaveSetup = {
  file: File | null;
  identity: EditableSaveIdentity;
};

// PendingSaveProfileEdit stores one in-progress dashboard metadata edit for the active profile.
// App.tsx uses this so the existing save-details dialog can be reused without mixing with upload setup state.
type PendingSaveProfileEdit = {
  identity: EditableSaveIdentity;
};

// getTrimmedValue normalizes one string-like value into a trimmed string.
// save setup helpers use this so save labels and trainer names follow the same fallback rules.
const getTrimmedValue = (value: string | null | undefined) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

// getDefaultUploadDisplayName derives an initial upload label from the chosen filename.
// App.tsx uses this so upload setup starts with a real derived value instead of a hardcoded placeholder.
const getDefaultUploadDisplayName = (file: File) => {
  const extensionIndex = file.name.lastIndexOf(".");

  if (extensionIndex <= 0) {
    return file.name;
  }

  return file.name.slice(0, extensionIndex);
};

// getFallbackSaveName resolves the safe fallback label for one save source and session mode.
// save setup uses this so guest and manual flows never leak placeholder names into the UI.
const getFallbackSaveName = ({
  sourceType,
  isGuestSession
}: {
  sourceType: EditableSaveIdentity["sourceType"];
  isGuestSession: boolean;
}) => {
  if (sourceType === "manual" && isGuestSession) {
    return "Guest Save";
  }

  return "Unnamed Save";
};

// getDefaultDexScope resolves the initial dex scope from the loaded save's National Dex state.
// App.tsx uses this so uploads and profile switches default to regional scope until National Dex is unlocked.
const getDefaultDexScope = (hasNationalDex: boolean): DexScope => {
  return hasNationalDex ? "national" : "regional";
};

// getDefaultDexScopeFromUploadResponse reads the parser debug payload and derives the dashboard's initial dex scope.
// App.tsx uses this so scope resets stay centralized across upload, switch, and reset flows.
const getDefaultDexScopeFromUploadResponse = (nextUploadResponse: UploadResponse | null): DexScope => {
  return getDefaultDexScope(
    nextUploadResponse && nextUploadResponse.debug && nextUploadResponse.debug.hasNationalDex
      ? nextUploadResponse.debug.hasNationalDex
      : false
  );
};

// getSaveNameFromIdentity builds the final save label used by manual shells and upload requests.
// App.tsx calls this so save naming stays centralized across guest, upload, and manual flows.
const getSaveNameFromIdentity = ({
  identity,
  isGuestSession
}: {
  identity: EditableSaveIdentity;
  isGuestSession: boolean;
}) => {
  const trimmedDisplayName = getTrimmedValue(identity.displayName);

  if (trimmedDisplayName) {
    return trimmedDisplayName;
  }

  const trimmedTrainerName = getTrimmedValue(identity.trainerName);

  if (trimmedTrainerName) {
    return trimmedTrainerName;
  }

  return getFallbackSaveName({
    sourceType: identity.sourceType,
    isGuestSession
  });
};

// getEditableIdentityFromUploadResponse derives the shared save identity shape from one completed upload payload.
// App.tsx uses this so dashboard code can read one consistent identity field for uploaded saves.
const getEditableIdentityFromUploadResponse = (nextUploadResponse: UploadResponse): EditableSaveIdentity => {
  const trainerNameFromTrainerInfo =
    nextUploadResponse.trainerInfo && nextUploadResponse.trainerInfo.name
      ? getTrimmedValue(nextUploadResponse.trainerInfo.name)
      : "";
  const trainerNameFromDebug =
    nextUploadResponse.debug && nextUploadResponse.debug.trainerName
      ? getTrimmedValue(nextUploadResponse.debug.trainerName)
      : "";

  return {
    displayName: getTrimmedValue(nextUploadResponse.saveProfile.name),
    trainerName: trainerNameFromTrainerInfo || trainerNameFromDebug,
    game: nextUploadResponse.upload.detectedGame
      ? nextUploadResponse.upload.detectedGame
      : nextUploadResponse.saveProfile.game,
    sourceType: "upload"
  };
};

// getUploadResponseWithIdentity attaches the shared editable identity to one upload payload.
// App.tsx calls this after upload reads and writes so downstream UI can rely on one identity model.
const getUploadResponseWithIdentity = (nextUploadResponse: UploadResponse): UploadResponse => {
  return Object.assign({}, nextUploadResponse, {
    editableIdentity: getEditableIdentityFromUploadResponse(nextUploadResponse)
  });
};

// getUploadResponseWithEditedIdentity applies one save-profile metadata edit to the active dashboard payload.
// App.tsx uses this so local shells and persisted profiles update the same frontend shape after an edit.
const getUploadResponseWithEditedIdentity = ({
  currentUploadResponse,
  identity,
  isGuestSession
}: {
  currentUploadResponse: UploadResponse;
  identity: EditableSaveIdentity;
  isGuestSession: boolean;
}): UploadResponse => {
  const nextSaveName = getSaveNameFromIdentity({
    identity,
    isGuestSession
  });
  const nextEditableIdentity = Object.assign({}, identity, {
    displayName: nextSaveName,
    trainerName: getTrimmedValue(identity.trainerName)
  });

  return Object.assign({}, currentUploadResponse, {
    saveProfile: Object.assign({}, currentUploadResponse.saveProfile, {
      name: nextSaveName,
      game: identity.game
    }),
    editableIdentity: nextEditableIdentity
  });
};

// getInitialSaveSetupIdentity builds the starting identity payload for a new upload or manual setup flow.
// App.tsx uses this so the SaveDetailsForm can open with real defaults from the current entry path.
const getInitialSaveSetupIdentity = ({
  sourceType,
  isGuestSession,
  file
}: {
  sourceType: EditableSaveIdentity["sourceType"];
  isGuestSession: boolean;
  file: File | null;
}) => {
  return {
    displayName:
      file !== null
        ? getDefaultUploadDisplayName(file)
        : getFallbackSaveName({
          sourceType,
          isGuestSession
        }),
    trainerName: "",
    game: null,
    sourceType
  };
};

// getManualUploadResponse builds the synthetic upload payload used by frontend-only manual shells.
// App.tsx uses this so manual entry can reuse the loaded dashboard route without a backend save profile.
const getManualUploadResponse = ({
  currentUser,
  identity,
  isGuestSession
}: {
  currentUser: StoredUser;
  identity: EditableSaveIdentity;
  isGuestSession: boolean;
}): UploadResponse => {
  const now = new Date().toISOString();
  const manualId = `manual-shell-${Date.now().toString()}`;
  const trainerName = getTrimmedValue(identity.trainerName);
  const saveName = getSaveNameFromIdentity({
    identity,
    isGuestSession
  });

  return {
    upload: {
      id: `manual-upload-${Date.now().toString()}`,
      userId: currentUser.id,
      saveProfileId: manualId,
      originalFilename: "manual-entry",
      storageProvider: "MANUAL",
      storageKey: "manual-entry",
      fileUrl: null,
      fileSizeBytes: 0,
      parseStatus: "COMPLETED",
      detectedGame: identity.game,
      parseError: null,
      createdAt: now,
      updatedAt: now,
      trainerName: trainerName || null,
      trainerGender: null
    },
    saveProfile: {
      id: manualId,
      userId: currentUser.id,
      name: saveName,
      game: identity.game,
      createdAt: now,
      updatedAt: now
    },
    trainerInfo: trainerName
      ? {
        name: trainerName,
        gender: "Unknown"
      }
      : undefined,
    editableIdentity: Object.assign({}, identity, {
      displayName: saveName,
      trainerName
    })
  };
};

const App = () => {
  const restoredSession = restoreSession();

  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [dexResponse, setDexResponse] = useState<DexResponse | null>(null);
  const [guestDexOverrides, setGuestDexOverrides] = useState<GuestDexOverrideMap>({});
  const [saveProfiles, setSaveProfiles] = useState<SaveProfileRecord[]>([]);
  const [activeSaveProfileId, setActiveSaveProfileId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<DexFilter>("all");
  const [selectedScope, setSelectedScope] = useState<DexScope>("regional");
  const [selectedGridDensity, setSelectedGridDensity] = useState<DexGridDensity>("default");
  const [selectedDexNumber, setSelectedDexNumber] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(restoredSession.user);
  const [sessionMode, setSessionMode] = useState<SessionMode>(restoredSession.mode);
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [pendingManualGameSelection, setPendingManualGameSelection] =
    useState<PendingManualGameSelection | null>(null);
  const [pendingSaveSetup, setPendingSaveSetup] = useState<PendingSaveSetup | null>(null);
  const [pendingSaveProfileEdit, setPendingSaveProfileEdit] =
    useState<PendingSaveProfileEdit | null>(null);
  const isGuestMode = sessionMode === "guest";
  const isLocalDexMode =
    isGuestMode ||
    (
      uploadResponse &&
      uploadResponse.editableIdentity
        ? uploadResponse.editableIdentity.sourceType === "manual"
        : false
    );

  // getCollectionLayerPatchValues reads one layer's visible booleans before a manual edit is normalized.
  // App.tsx uses this so standard and shiny edits share the same living -> caught -> seen -> missing tier rules.
  const getCollectionLayerPatchValues = ({
    currentEntry,
    layerKey,
    patch
  }: {
    currentEntry: DexResponse["entries"][number];
    layerKey: DexCollectionLayerKey;
    patch: UpdateDexEntryRequest;
  }) => {
    const currentLayer = currentEntry[layerKey];
    const patchLayer = patch[layerKey];
    const nextLayerState = {
      seen: currentLayer.seen,
      caught: currentLayer.caught,
      hasLivingEntry: currentLayer.hasLivingEntry
    };

    if (patchLayer && typeof patchLayer.seen === "boolean") {
      nextLayerState.seen = patchLayer.seen;
    }

    if (patchLayer && typeof patchLayer.caught === "boolean") {
      nextLayerState.caught = patchLayer.caught;
    }

    if (patchLayer && typeof patchLayer.hasLivingEntry === "boolean") {
      nextLayerState.hasLivingEntry = patchLayer.hasLivingEntry;
    }

    if (patchLayer && patchLayer.seen === false) {
      nextLayerState.caught = false;
      nextLayerState.hasLivingEntry = false;
    }

    if (patchLayer && patchLayer.caught === false) {
      nextLayerState.hasLivingEntry = false;
    }

    if (nextLayerState.hasLivingEntry) {
      nextLayerState.caught = true;
      nextLayerState.seen = true;
    }

    if (nextLayerState.caught) {
      nextLayerState.seen = true;
    }

    return nextLayerState;
  };

  // hasDexCollectionPatchObject checks whether one layer patch object exists with any own keys.
  // App.tsx uses this so guest overrides preserve explicit standard or shiny layer intent even when values normalize to false.
  const hasDexCollectionPatchObject = (
    layerPatch: UpdateDexEntryRequest[DexCollectionLayerKey] | undefined
  ) => {
    if (!layerPatch) {
      return false;
    }

    return Object.keys(layerPatch).length > 0;
  };

  // buildDexSummary recalculates summary totals from a dex entry list.
  // guest merged dex state uses this so frontend-only overrides stay consistent with the sidebar and cards.
  const buildDexSummary = (entries: DexResponse["entries"]) => {
    return {
      standard: {
        totalEntries: entries.length,
        seenCount: entries.filter((entry) => {
          return entry.standard.seen;
        }).length,
        caughtCount: entries.filter((entry) => {
          return entry.standard.caught;
        }).length,
        livingCount: entries.filter((entry) => {
          return entry.standard.hasLivingEntry;
        }).length
      },
      shiny: {
        totalEntries: entries.length,
        seenCount: entries.filter((entry) => {
          return entry.shiny.seen;
        }).length,
        caughtCount: entries.filter((entry) => {
          return entry.shiny.caught;
        }).length,
        livingCount: entries.filter((entry) => {
          return entry.shiny.hasLivingEntry;
        }).length
      },
      ownership: {
        totalOwnedCount: entries.reduce((currentTotal, entry) => {
          return currentTotal + entry.ownership.totalOwnedCount;
        }, 0),
        totalShinyOwnedCount: entries.reduce((currentTotal, entry) => {
          return currentTotal + entry.ownership.shinyOwnedCount;
        }, 0)
      }
    };
  };

  // getResolvedOwnershipState projects visible owned counters from imported ownership and resolved collection state.
  // guest merged dex state uses this so manual standard and shiny edits keep sidebar ownership counts in sync.
  const getResolvedOwnershipState = ({
    ownership,
    standard,
    shiny
  }: {
    ownership: DexResponse["entries"][number]["ownership"];
    standard: DexResponse["entries"][number]["standard"];
    shiny: DexResponse["entries"][number]["shiny"];
  }) => {
    const hasResolvedStandardOwnership = standard.caught || standard.hasLivingEntry;
    const hasResolvedShinyOwnership = shiny.caught || shiny.hasLivingEntry;
    const resolvedShinyOwnedCount = hasResolvedShinyOwnership
      ? Math.max(ownership.shinyOwnedCount, 1)
      : 0;
    const resolvedStandardOwnedCount = hasResolvedStandardOwnership
      ? Math.max(ownership.totalOwnedCount, 1)
      : 0;

    return {
      totalOwnedCount: Math.max(resolvedStandardOwnedCount, resolvedShinyOwnedCount),
      shinyOwnedCount: resolvedShinyOwnedCount
    };
  };

  // getMergedGuestDexResponse overlays local frontend edits on top of the current dex data.
  // App.tsx uses this so guest uploads and manual shells can edit dex state without backend writes.
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
      const nextStandard = Object.assign({}, entry.standard);
      const nextShiny = Object.assign({}, entry.shiny);

      if (override.standard && typeof override.standard.seen === "boolean") {
        nextStandard.seen = override.standard.seen;
      }

      if (override.standard && typeof override.standard.caught === "boolean") {
        nextStandard.caught = override.standard.caught;
      }

      if (override.standard && typeof override.standard.hasLivingEntry === "boolean") {
        nextStandard.hasLivingEntry = override.standard.hasLivingEntry;
      }

      if (override.shiny && typeof override.shiny.seen === "boolean") {
        nextShiny.seen = override.shiny.seen;
      }

      if (override.shiny && typeof override.shiny.caught === "boolean") {
        nextShiny.caught = override.shiny.caught;
      }

      if (override.shiny && typeof override.shiny.hasLivingEntry === "boolean") {
        nextShiny.hasLivingEntry = override.shiny.hasLivingEntry;
      }

      nextEntry.standard = nextStandard;
      nextEntry.shiny = nextShiny;
      nextEntry.ownership = getResolvedOwnershipState({
        ownership: entry.ownership,
        standard: nextStandard,
        shiny: nextShiny
      });
      return nextEntry;
    });

    return {
      summary: buildDexSummary(mergedEntries),
      entries: mergedEntries
    };
  };

  // displayedDexResponse chooses the backend dex for persisted saves and the locally merged dex for session-only flows.
  // App.tsx passes this into LoadedDashboardView so guest uploads and manual shells share the same dashboard path.
  const displayedDexResponse =
    dexResponse && isLocalDexMode
      ? getMergedGuestDexResponse(dexResponse, guestDexOverrides)
      : dexResponse;

  // getNormalizedDexEntryPatch applies the dex tier hierarchy before any guest or backend update is saved.
  // handleUpdateDexEntry uses this so seen, caught, and living stay consistent across both edit paths.
  const getNormalizedDexEntryPatch = ({
    pokemonSpeciesId,
    patch,
  }: {
    pokemonSpeciesId: number;
    patch: UpdateDexEntryRequest;
  }): UpdateDexEntryRequest => {
    const dexEntriesSource =
      displayedDexResponse ? displayedDexResponse.entries : dexResponse ? dexResponse.entries : [];

    const currentEntry = dexEntriesSource.find((entry) => {
      return entry.pokemonSpeciesId === pokemonSpeciesId;
    });

    if (!currentEntry) {
      return patch;
    }

    const normalizedPatch: UpdateDexEntryRequest = {};
    const applyNormalizedLayerPatch = (layerKey: DexCollectionLayerKey) => {
      const patchLayer = patch[layerKey];

      if (!hasDexCollectionPatchObject(patchLayer)) {
        return;
      }

      const nextLayerState = getCollectionLayerPatchValues({
        currentEntry,
        layerKey,
        patch
      });

      normalizedPatch[layerKey] = {
        seen: nextLayerState.seen,
        caught: nextLayerState.caught,
        hasLivingEntry: nextLayerState.hasLivingEntry
      };
    };

    applyNormalizedLayerPatch("standard");
    applyNormalizedLayerPatch("shiny");

    return normalizedPatch;
  };

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

  // resetLoadedSaveState clears the currently open save while keeping the current auth session intact.
  // Empty-state transitions and auth changes call this so loaded save state resets in one place.
  const resetLoadedSaveState = () => {
    setUploadResponse(null);
    setDexResponse(null);
    setGuestDexOverrides({});
    setActiveSaveProfileId(null);
    setPendingManualGameSelection(null);
    setPendingSaveSetup(null);
    setPendingSaveProfileEdit(null);
    setSelectedDexNumber(null);
    setSelectedFilter("all");
    setSelectedScope("regional");
    setIsUploading(false);
    setErrorMessage("");
  };

  // handleUploadSuccess finalizes one completed upload and moves the app into the loaded dashboard state.
  // executeUploadFlow uses this for new uploads, guest uploads, and save replacements from the dashboard.
  const handleUploadSuccess = (
    nextUploadResponse: UploadResponse,
    nextDexResponse: DexResponse
  ) => {
    const nextUploadResponseWithIdentity = getUploadResponseWithIdentity(nextUploadResponse);

    setPendingManualGameSelection(null);
    setPendingSaveSetup(null);
    setUploadResponse(nextUploadResponseWithIdentity);
    setDexResponse(nextDexResponse);
    setGuestDexOverrides({});
    setActiveSaveProfileId(nextUploadResponseWithIdentity.saveProfile.id);
    setSelectedFilter("all");
    setSelectedScope(getDefaultDexScopeFromUploadResponse(nextUploadResponseWithIdentity));

    if (sessionMode === "user") {
      setSaveProfiles((currentSaveProfiles) => {
        const existingProfileIndex = currentSaveProfiles.findIndex((saveProfile) => {
          return saveProfile.id === nextUploadResponseWithIdentity.saveProfile.id;
        });

        if (existingProfileIndex === -1) {
          return [nextUploadResponseWithIdentity.saveProfile].concat(currentSaveProfiles);
        }

        return currentSaveProfiles.map((saveProfile) => {
          if (saveProfile.id === nextUploadResponseWithIdentity.saveProfile.id) {
            return nextUploadResponseWithIdentity.saveProfile;
          }

          return saveProfile;
        });
      });
    }

    if (nextDexResponse.entries.length > 0) {
      setSelectedDexNumber(nextDexResponse.entries[0].dexNumber);
    } else {
      setSelectedDexNumber(null);
    }

    setIsUploading(false);
    setErrorMessage("");
  };

  // handleUploadError clears transient upload state and shows the latest upload-related error message.
  // UploadHero and save setup flows call this for file validation and upload execution failures.
  const handleUploadError = (nextErrorMessage: string) => {
    setPendingManualGameSelection(null);
    setIsUploading(false);
    setErrorMessage(nextErrorMessage);
  };

  // executeUploadFlow sends one upload request and either finalizes the dashboard state or pauses for FRLG title selection.
  // App.tsx uses this shared path for new uploads, replacement uploads, and manual override resubmits.
  const executeUploadFlow = async ({
    file,
    requestFields
  }: {
    file: File;
    requestFields: UploadRequestFields;
  }) => {
    if (!currentUser) {
      throw new Error("No user is currently signed in.");
    }

    const formData = buildUploadSaveFormData({
      file,
      requestFields
    });
    const uploadResult = await uploadSaveAndFetchDex(formData, currentUser);

    if ("status" in uploadResult) {
      setPendingManualGameSelection({
        file,
        requestFields,
        requirement: uploadResult
      });
      setIsUploading(false);
      setErrorMessage("");
      return;
    }

    handleUploadSuccess(uploadResult.uploadResponse, uploadResult.dexResponse);
  };

  // handleSelectUploadFile opens shared save setup for the chosen upload file.
  // EmptyStateView calls this so upload naming stays outside UploadHero and out of the main dashboard tree.
  const handleSelectUploadFile = (file: File) => {
    setErrorMessage("");
    setPendingManualGameSelection(null);
    setPendingSaveSetup({
      file,
      identity: getInitialSaveSetupIdentity({
        sourceType: "upload",
        isGuestSession: isGuestMode,
        file
      })
    });
  };

  // handleCreateManualEntry opens shared save setup for a new manual save shell.
  // EmptyStateView calls this so manual creation reuses the same identity model as uploads.
  const handleCreateManualEntry = () => {
    setErrorMessage("");
    setPendingManualGameSelection(null);
    setPendingSaveSetup({
      file: null,
      identity: getInitialSaveSetupIdentity({
        sourceType: "manual",
        isGuestSession: isGuestMode,
        file: null
      })
    });
  };

  // handleCancelSaveSetup closes the shared save setup dialog without mutating the current loaded save state.
  // SaveDetailsForm calls this so upload and manual setup can be abandoned cleanly.
  const handleCancelSaveSetup = () => {
    setPendingSaveSetup(null);
    setErrorMessage("");
  };

  // handleOpenSaveProfileEdit opens the shared metadata dialog for the active profile name and game fields.
  // LoadedDashboardView calls this so the summary card can edit profile metadata without a separate custom modal.
  const handleOpenSaveProfileEdit = () => {
    if (!uploadResponse || !uploadResponse.editableIdentity) {
      setErrorMessage("No active save profile is available to edit.");
      return;
    }

    setPendingSaveProfileEdit({
      identity: Object.assign({}, uploadResponse.editableIdentity)
    });
    setErrorMessage("");
  };

  // handleCancelSaveProfileEdit closes the active profile metadata dialog with no changes.
  // SaveDetailsForm calls this when the user abandons a dashboard metadata edit.
  const handleCancelSaveProfileEdit = () => {
    setPendingSaveProfileEdit(null);
    setErrorMessage("");
  };

  // handleSubmitSaveProfileEdit applies one active profile metadata edit locally or through the backend.
  // SaveDetailsForm calls this so profile name and game edits reuse the shared dialog flow.
  const handleSubmitSaveProfileEdit = async (identity: EditableSaveIdentity) => {
    if (!uploadResponse) {
      setErrorMessage("No active save profile is available to edit.");
      return;
    }

    const normalizedIdentity = Object.assign({}, identity, {
      displayName: getSaveNameFromIdentity({
        identity,
        isGuestSession: isGuestMode
      }),
      trainerName: getTrimmedValue(identity.trainerName)
    });

    try {
      setIsUploading(true);
      setErrorMessage("");

      if (isLocalDexMode || !currentUser || !activeSaveProfileId) {
        setUploadResponse(getUploadResponseWithEditedIdentity({
          currentUploadResponse: uploadResponse,
          identity: normalizedIdentity,
          isGuestSession: isGuestMode
        }));
        setPendingSaveProfileEdit(null);
        setIsUploading(false);
        return;
      }

      const patch: UpdateSaveProfileRequest = {
        name: normalizedIdentity.displayName,
        game: normalizedIdentity.game
      };
      const updatedSaveProfile = await updateSaveProfileMetadata({
        saveProfileId: activeSaveProfileId,
        patch,
        currentUser
      });

      setUploadResponse((currentUploadResponse) => {
        if (!currentUploadResponse) {
          return currentUploadResponse;
        }

        return Object.assign({}, currentUploadResponse, {
          saveProfile: updatedSaveProfile,
          editableIdentity: currentUploadResponse.editableIdentity
            ? Object.assign({}, currentUploadResponse.editableIdentity, {
              displayName: updatedSaveProfile.name,
              game: updatedSaveProfile.game
            })
            : currentUploadResponse.editableIdentity
        });
      });
      setSaveProfiles((currentSaveProfiles) => {
        return currentSaveProfiles.map((saveProfile) => {
          if (saveProfile.id === updatedSaveProfile.id) {
            return updatedSaveProfile;
          }

          return saveProfile;
        });
      });
      setPendingSaveProfileEdit(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update save profile"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // handleSubmitSaveSetup finalizes shared save identity input for upload or manual shell creation.
  // SaveDetailsForm calls this so App.tsx can keep setup orchestration centralized.
  const handleSubmitSaveSetup = async (identity: EditableSaveIdentity) => {
    if (!currentUser || !pendingSaveSetup) {
      setErrorMessage("No active save setup is available.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");
      setPendingManualGameSelection(null);

      if (pendingSaveSetup.file) {
        const saveProfileName = getSaveNameFromIdentity({
          identity,
          isGuestSession: isGuestMode
        });

        setPendingSaveSetup(null);

        await executeUploadFlow({
          file: pendingSaveSetup.file,
          requestFields: {
            saveProfileName
          }
        });
        return;
      }

      const dexTemplate = await fetchDexTemplate();
      const manualUploadResponse = getManualUploadResponse({
        currentUser,
        identity,
        isGuestSession: isGuestMode
      });

      setPendingSaveSetup(null);
      setUploadResponse(manualUploadResponse);
      setDexResponse(dexTemplate);
      setGuestDexOverrides({});
      setActiveSaveProfileId(null);
      setSelectedFilter("all");
      setSelectedScope(getDefaultDexScopeFromUploadResponse(manualUploadResponse));
      setSelectedDexNumber(
        dexTemplate.entries.length > 0 ? dexTemplate.entries[0].dexNumber : null
      );
      setIsUploading(false);
      setErrorMessage("");
    } catch (error) {
      setIsUploading(false);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to finish save setup"
      );
    }
  };

  // handleSubmitManualGameOverride resumes a paused FRLG upload using the user-selected title override.
  // ManualGameOverridePrompt calls this so the chooser remains a UI-only wrapper around the upload flow.
  const handleSubmitManualGameOverride = async (
    selectedGame: ManualGen3GameOverride
  ) => {
    if (!pendingManualGameSelection) {
      setErrorMessage("No pending upload is waiting for a game selection.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");

      const nextRequestFields = Object.assign(
        {},
        pendingManualGameSelection.requestFields,
        {
          manualGameOverride: selectedGame
        }
      );

      await executeUploadFlow({
        file: pendingManualGameSelection.file,
        requestFields: nextRequestFields
      });
    } catch (error) {
      setIsUploading(false);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit manual game override"
      );
    }
  };

  // handleCancelManualGameOverride abandons the paused FRLG title-selection step without changing the current dashboard state.
  // ManualGameOverridePrompt calls this so users can back out of the manual override flow cleanly.
  const handleCancelManualGameOverride = () => {
    setPendingManualGameSelection(null);
    setIsUploading(false);
    setErrorMessage("");
  };

  // handleDecreaseGridDensity moves the dex grid toward more cards per row and smaller cards.
  // LoadedDashboardView calls this from the minus control so the symbol matches denser card layout.
  const handleDecreaseGridDensity = () => {
    setSelectedGridDensity((currentGridDensity) => {
      if (currentGridDensity === "extraComfortable") {
        return "comfortable";
      }

      if (currentGridDensity === "comfortable") {
        return "default";
      }

      if (currentGridDensity === "default") {
        return "compact";
      }

      if (currentGridDensity === "compact") {
        return "extraCompact";
      }

      return currentGridDensity;
    });
  };

  // handleIncreaseGridDensity moves the dex grid toward fewer cards per row and larger cards.
  // LoadedDashboardView calls this from the plus control so the symbol matches roomier card layout.
  const handleIncreaseGridDensity = () => {
    setSelectedGridDensity((currentGridDensity) => {
      if (currentGridDensity === "extraCompact") {
        return "compact";
      }

      if (currentGridDensity === "compact") {
        return "default";
      }

      if (currentGridDensity === "default") {
        return "comfortable";
      }

      if (currentGridDensity === "comfortable") {
        return "extraComfortable";
      }

      return currentGridDensity;
    });
  };

  // handleUpdateActiveProfileSave uploads a replacement file for the active save or converts a local shell into an upload.
  // LoadedDashboardView calls this so persisted saves and manual shells can both continue through the upload flow.
  const handleUpdateActiveProfileSave = async (file: File) => {
    if (!currentUser) {
      setErrorMessage("No user is currently signed in.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");
      setPendingManualGameSelection(null);

      if (
        isLocalDexMode ||
        !activeSaveProfileId ||
        !uploadResponse ||
        !uploadResponse.editableIdentity
      ) {
        await executeUploadFlow({
          file,
          requestFields: {
            saveProfileName:
              uploadResponse && uploadResponse.editableIdentity
                ? getSaveNameFromIdentity({
                  identity: uploadResponse.editableIdentity,
                  isGuestSession: isGuestMode
                })
                : getDefaultUploadDisplayName(file)
          }
        });
        return;
      }

      await executeUploadFlow({
        file,
        requestFields: {
          saveProfileId: activeSaveProfileId
        }
      });
    } catch (error) {
      console.error("Failed to update active save profile", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update save"
      );
      setIsUploading(false);
    }
  };

  // handleSelectSaveProfile switches the dashboard to another persisted save profile.
  // LoadedDashboardView calls this when the user chooses a different saved profile in the sidebar.
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
      const nextDexResponse = nextUploadResponse.dex
        ? nextUploadResponse.dex
        : await fetchDexBySaveProfileId(saveProfileId, currentUser);

      setUploadResponse(getUploadResponseWithIdentity(nextUploadResponse));
      setDexResponse(nextDexResponse);
      setGuestDexOverrides({});
      setActiveSaveProfileId(saveProfileId);
      setSelectedFilter("all");
      setSelectedScope(getDefaultDexScopeFromUploadResponse(nextUploadResponse));

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

  // handleDeleteProfile removes one persisted profile and clears the dashboard if it was active.
  // LoadedDashboardView calls this after the user confirms profile deletion.
  const handleDeleteProfile = async (saveProfileId: string) => {
    if (!currentUser) {
      setErrorMessage("No user is currently signed in.");
      return;
    }

    try {
      await deleteSaveProfile(saveProfileId, currentUser);

      setSaveProfiles((currentSaveProfiles) => {
        return currentSaveProfiles.filter((saveProfile) => {
          return saveProfile.id !== saveProfileId;
        });
      });

      if (activeSaveProfileId === saveProfileId) {
        resetLoadedSaveState();
      }

      setErrorMessage("");
    } catch (error) {
      console.error("Failed to delete save profile", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete save profile"
      );
    }
  };

  // handleUpdateDexEntry applies one manual dex edit for the selected pokemon.
  // Persisted uploads write through the backend, while guest uploads and manual shells store frontend-only overrides.
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

    const normalizedPatch = getNormalizedDexEntryPatch({
      pokemonSpeciesId,
      patch
    });

    if (isLocalDexMode) {
      setGuestDexOverrides((currentOverrides) => {
        const currentOverride = currentOverrides[pokemonSpeciesId];
        const nextOverride = currentOverride ? Object.assign({}, currentOverride) : {};
        // applyLayerOverride writes one normalized layer patch into the guest override map.
        // handleUpdateDexEntry uses this so standard and shiny frontend-only edits stay structurally parallel.
        const applyLayerOverride = (layerKey: DexCollectionLayerKey) => {
          const normalizedLayerPatch = normalizedPatch[layerKey];

          if (!hasDexCollectionPatchObject(normalizedLayerPatch)) {
            return;
          }

          const currentLayerOverride =
            currentOverride && currentOverride[layerKey]
              ? currentOverride[layerKey]
              : {};
          const nextLayerOverride = Object.assign({}, currentLayerOverride);

          if (
            normalizedLayerPatch &&
            Object.prototype.hasOwnProperty.call(normalizedLayerPatch, "seen")
          ) {
            if (normalizedLayerPatch.seen === null) {
              delete nextLayerOverride.seen;
            } else {
              nextLayerOverride.seen = normalizedLayerPatch.seen;
            }
          }

          if (
            normalizedLayerPatch &&
            Object.prototype.hasOwnProperty.call(normalizedLayerPatch, "caught")
          ) {
            if (normalizedLayerPatch.caught === null) {
              delete nextLayerOverride.caught;
            } else {
              nextLayerOverride.caught = normalizedLayerPatch.caught;
            }
          }

          if (
            normalizedLayerPatch &&
            Object.prototype.hasOwnProperty.call(normalizedLayerPatch, "hasLivingEntry")
          ) {
            if (normalizedLayerPatch.hasLivingEntry === null) {
              delete nextLayerOverride.hasLivingEntry;
            } else {
              nextLayerOverride.hasLivingEntry = normalizedLayerPatch.hasLivingEntry;
            }
          }

          nextOverride[layerKey] = nextLayerOverride;
        };

        applyLayerOverride("standard");
        applyLayerOverride("shiny");

        const nextOverrides = Object.assign({}, currentOverrides);

        if (!hasDexCollectionPatchObject(nextOverride.standard)) {
          delete nextOverride.standard;
        }

        if (!hasDexCollectionPatchObject(nextOverride.shiny)) {
          delete nextOverride.shiny;
        }

        if (!nextOverride.standard && !nextOverride.shiny) {
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
        patch: normalizedPatch,
        currentUser
      });

      setDexResponse(nextDexResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update dex entry"
      );
    }
  };

  // handleResetToEmptyState clears the currently loaded save while keeping the current auth session active.
  // LoadedDashboardView calls this when returning from the dashboard to the setup entry points.
  const handleResetToEmptyState = () => {
    resetLoadedSaveState();
  };

  // handleGoToLogin clears temporary state and returns the app to login mode.
  // Guest CTA buttons call this so guest sessions can transition into the auth flow.
  const handleGoToLogin = () => {
    clearStoredUser();
    resetLoadedSaveState();
    setSaveProfiles([]);
    setCurrentUser(null);
    setSessionMode("auth");
    setAuthMode("login");
    setErrorMessage("");
  };

  // handleGoToRegister clears temporary state and returns the app to register mode.
  // Guest CTA buttons call this so guest sessions can transition into account creation flow.
  const handleGoToRegister = () => {
    clearStoredUser();
    resetLoadedSaveState();
    setSaveProfiles([]);
    setCurrentUser(null);
    setSessionMode("auth");
    setAuthMode("register");
    setErrorMessage("");
  };

  // handleLogout clears persisted auth, loaded save state, and save profile list state.
  // LoadedDashboardView calls this so the app always returns to the auth screen after logout.
  const handleLogout = () => {
    clearStoredUser();
    setLoginEmail("");
    resetLoadedSaveState();
    setSaveProfiles([]);
    setCurrentUser(null);
    setSessionMode("auth");
  };

  if (sessionMode === "auth" || !currentUser) {
    return (
      <>
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
        <ManualGameOverridePrompt
          isOpen={false}
          isSubmitting={false}
          message=""
          onSelectGame={handleSubmitManualGameOverride}
          onCancel={handleCancelManualGameOverride}
        />
      </>
    );
  }

  if (!uploadResponse || !displayedDexResponse) {
    return (
      <>
        <div className="min-h-screen bg-[#f6f5dc] text-[#38392a]">
          <EmptyStateView
            isUploading={isUploading}
            errorMessage={errorMessage}
            onSelectUploadFile={handleSelectUploadFile}
            onCreateManualEntry={handleCreateManualEntry}
            onUploadError={handleUploadError}
          />
        </div>
        <SaveDetailsForm
          isOpen={pendingSaveSetup !== null}
          title={
            pendingSaveSetup && pendingSaveSetup.file
              ? "Name this uploaded save"
              : "Create a manual save shell"
          }
          description={
            pendingSaveSetup && pendingSaveSetup.file
              ? "Confirm the save label before the upload starts. Game detection still comes from the uploaded file."
              : "Choose the game and identity details for a blank tracker shell."
          }
          confirmLabel={
            pendingSaveSetup && pendingSaveSetup.file
              ? "Start Upload"
              : "Create Save"
          }
          isSubmitting={isUploading}
          identity={
            pendingSaveSetup
              ? pendingSaveSetup.identity
              : getInitialSaveSetupIdentity({
                sourceType: "manual",
                isGuestSession: isGuestMode,
                file: null
              })
          }
          showTrainerNameField={pendingSaveSetup ? pendingSaveSetup.file === null : true}
          showGameField={pendingSaveSetup ? pendingSaveSetup.file === null : true}
          requireGameSelection={pendingSaveSetup ? pendingSaveSetup.file === null : true}
          onSubmit={handleSubmitSaveSetup}
          onCancel={handleCancelSaveSetup}
        />
        <ManualGameOverridePrompt
          isOpen={pendingManualGameSelection !== null}
          isSubmitting={isUploading}
          message={
            pendingManualGameSelection
              ? pendingManualGameSelection.requirement.message
              : ""
          }
          onSelectGame={handleSubmitManualGameOverride}
          onCancel={handleCancelManualGameOverride}
        />
      </>
    );
  }

  const sessionLabel = isGuestMode
    ? "Temporary local session"
    : currentUser.email;

  return (
    <>
      <div className="min-h-screen bg-[#f6f5dc] text-[#38392a]">
        <LoadedDashboardView
          uploadResponse={uploadResponse}
          dexResponse={displayedDexResponse}
          saveProfiles={saveProfiles}
          activeSaveProfileId={activeSaveProfileId}
          selectedFilter={selectedFilter}
          selectedScope={selectedScope}
          selectedGridDensity={selectedGridDensity}
          selectedDexNumber={selectedDexNumber}
          errorMessage={errorMessage}
          isUploading={isUploading}
          isGuestMode={isGuestMode}
          sessionLabel={sessionLabel}
          onChangeFilter={setSelectedFilter}
          onChangeScope={setSelectedScope}
          onDecreaseGridDensity={handleDecreaseGridDensity}
          onIncreaseGridDensity={handleIncreaseGridDensity}
          onSelectDexNumber={setSelectedDexNumber}
          onSelectSaveProfile={handleSelectSaveProfile}
          onUpdateSave={handleUpdateActiveProfileSave}
          onEditSaveProfile={handleOpenSaveProfileEdit}
          onUpdateDexEntry={handleUpdateDexEntry}
          onResetToEmptyState={handleResetToEmptyState}
          onDeleteProfile={handleDeleteProfile}
          onLogout={handleLogout}
          onGoToLogin={handleGoToLogin}
          onGoToRegister={handleGoToRegister}
        />
      </div>
      <ManualGameOverridePrompt
        isOpen={pendingManualGameSelection !== null}
        isSubmitting={isUploading}
        message={
          pendingManualGameSelection
            ? pendingManualGameSelection.requirement.message
            : ""
        }
        onSelectGame={handleSubmitManualGameOverride}
        onCancel={handleCancelManualGameOverride}
      />
      <SaveDetailsForm
        isOpen={pendingSaveProfileEdit !== null}
        title="Edit save profile"
        description="Update the saved profile name and game used by the dashboard."
        confirmLabel="Save Changes"
        isSubmitting={isUploading}
        identity={
          pendingSaveProfileEdit
            ? pendingSaveProfileEdit.identity
            : getInitialSaveSetupIdentity({
              sourceType: "upload",
              isGuestSession: isGuestMode,
              file: null
            })
        }
        showTrainerNameField={false}
        showGameField={true}
        requireGameSelection={false}
        onSubmit={handleSubmitSaveProfileEdit}
        onCancel={handleCancelSaveProfileEdit}
      />
    </>
  );
};


export default App;
