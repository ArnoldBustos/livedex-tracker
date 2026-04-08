import { AuthPanel } from "../auth/AuthPanel";
import type { AuthPanelMode } from "../auth/AuthPanel";
import { EmptyStateView } from "./EmptyStateView";
import { EntryTopbar } from "./EntryTopbar";
import type { SaveProfileRecord } from "../../types/save";

type EntryViewProps = {
    isSignedIn: boolean;
    isGuestMode: boolean;
    sessionLabel: string;
    selectedFileName: string | null;
    currentUserEmail: string;
    isUploading: boolean;
    isLoadingSaveProfiles: boolean;
    openingSaveProfileId: string | null;
    errorMessage: string;
    saveProfiles: SaveProfileRecord[];
    authMode: AuthPanelMode;
    email: string;
    isSubmittingAuth: boolean;
    onChangeEmail: (nextEmail: string) => void;
    onSubmitAuth: () => void;
    onContinueAsGuest: () => void;
    onLogout: () => void;
    onSwitchToLogin: () => void;
    onSwitchToRegister: () => void;
    onSelectUploadFile: (file: File) => void;
    onCreateManualEntry: () => void;
    onOpenExistingSave: (saveProfileId: string) => void;
    onUploadError: (errorMessage: string) => void;
};

// EntryView renders the unified pre-dashboard entry screen for auth, upload, and manual setup.
// App.tsx uses this as the shared landing state before any save or manual dashboard is loaded.
export const EntryView = ({
    isSignedIn,
    isGuestMode,
    sessionLabel,
    selectedFileName,
    currentUserEmail,
    isUploading,
    isLoadingSaveProfiles,
    openingSaveProfileId,
    errorMessage,
    saveProfiles,
    authMode,
    email,
    isSubmittingAuth,
    onChangeEmail,
    onSubmitAuth,
    onContinueAsGuest,
    onLogout,
    onSwitchToLogin,
    onSwitchToRegister,
    onSelectUploadFile,
    onCreateManualEntry,
    onOpenExistingSave,
    onUploadError
}: EntryViewProps) => {
    return (
        <div className="min-h-screen bg-[#f3f4f6] px-4 py-6 text-[#38392a] sm:px-6 sm:py-8">
            {isUploading ? (
                <div className="fixed left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-[rgba(130,129,111,0.18)] bg-white px-4 py-2 text-[12px] font-semibold text-[#38392a] shadow-sm">
                    {openingSaveProfileId ? "Opening saved profile..." : "Loading save data..."}
                </div>
            ) : null}

            <div className="mx-auto flex max-w-[1680px] flex-col gap-6">
                <EntryTopbar
                    selectedFileName={selectedFileName}
                    isUploading={isUploading}
                    isGuestMode={isGuestMode}
                    isSignedIn={isSignedIn}
                    sessionLabel={sessionLabel}
                    onSelectUploadFile={onSelectUploadFile}
                    onGoToLogin={onSwitchToLogin}
                    onGoToRegister={onSwitchToRegister}
                />

                <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="min-w-0 xl:h-full">
                        <EmptyStateView
                            isSignedIn={isSignedIn}
                            isUploading={isUploading}
                            isLoadingSaveProfiles={isLoadingSaveProfiles}
                            openingSaveProfileId={openingSaveProfileId}
                            errorMessage={errorMessage}
                            saveProfiles={saveProfiles}
                            onSelectUploadFile={onSelectUploadFile}
                            onCreateManualEntry={onCreateManualEntry}
                            onOpenExistingSave={onOpenExistingSave}
                            onUploadError={onUploadError}
                        />
                    </div>

                    <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
                        <AuthPanel
                            authMode={authMode}
                            isSignedIn={isSignedIn}
                            currentUserEmail={currentUserEmail}
                            email={email}
                            isSubmitting={isSubmittingAuth}
                            errorMessage={errorMessage}
                            showContinueAsGuest={false}
                            onChangeEmail={onChangeEmail}
                            onSubmit={onSubmitAuth}
                            onContinueAsGuest={onContinueAsGuest}
                            onLogout={onLogout}
                            onSwitchToLogin={onSwitchToLogin}
                            onSwitchToRegister={onSwitchToRegister}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
