import { useState } from "react";
import type { AuthPanelMode } from "../auth/AuthPanel";
import { EmptyStateView } from "./EmptyStateView";
import { EntryAuthModal } from "./EntryAuthModal";
import { EntryTopbar } from "./EntryTopbar";
import type { SaveProfileRecord } from "../../types/save";

type EntryViewProps = {
    isSignedIn: boolean;
    isGuestMode: boolean;
    currentUserEmail: string;
    isUploading: boolean;
    isLoadingSaveProfiles: boolean;
    openingSaveProfileId: string | null;
    errorMessage: string;
    saveProfiles: SaveProfileRecord[];
    authMode: AuthPanelMode;
    email: string;
    password: string;
    isSubmittingAuth: boolean;
    onChangeEmail: (nextEmail: string) => void;
    onChangePassword: (nextPassword: string) => void;
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
    currentUserEmail,
    isUploading,
    isLoadingSaveProfiles,
    openingSaveProfileId,
    errorMessage,
    saveProfiles,
    authMode,
    email,
    password,
    isSubmittingAuth,
    onChangeEmail,
    onChangePassword,
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
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    // isVisibleAuthModalOpen derives whether the modal should stay rendered after auth state changes.
    // EntryView uses this so successful sign-in hides the modal without a follow-up effect-driven state write.
    const isVisibleAuthModalOpen = isAuthModalOpen && !isSignedIn;

    // openLoginModal switches the shared auth modal into login mode before opening it.
    // EntryTopbar uses this so the sign-in button reuses the parent auth state and handlers.
    const openLoginModal = () => {
        onSwitchToLogin();
        setIsAuthModalOpen(true);
    };

    // openRegisterModal switches the shared auth modal into register mode before opening it.
    // EntryTopbar uses this so the create-account button reuses the parent auth state and handlers.
    const openRegisterModal = () => {
        onSwitchToRegister();
        setIsAuthModalOpen(true);
    };

    // closeAuthModal hides the entry auth overlay without mutating the underlying auth state.
    // EntryView uses this for overlay dismissal and close-button dismissal.
    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] text-[#38392a]">
            {isUploading ? (
                <div className="fixed left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-[rgba(130,129,111,0.18)] bg-white px-4 py-2 text-[12px] font-semibold text-[#38392a] shadow-sm">
                    {openingSaveProfileId ? "Opening saved profile..." : "Loading save data..."}
                </div>
            ) : null}

            <div className="mx-auto flex max-w-[1680px] flex-col">
                <EntryTopbar
                    isUploading={isUploading}
                    isGuestMode={isGuestMode}
                    isSignedIn={isSignedIn}
                    currentUserEmail={currentUserEmail}
                    onGoToLogin={openLoginModal}
                    onGoToRegister={openRegisterModal}
                    onLogout={onLogout}
                />

                <div className="px-4 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4">
                    <div className="mx-auto w-full max-w-[1180px]">
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
                </div>
            </div>

            <EntryAuthModal
                isOpen={isVisibleAuthModalOpen}
                authMode={authMode}
                currentUserEmail={currentUserEmail}
                email={email}
                password={password}
                isSubmitting={isSubmittingAuth}
                errorMessage={errorMessage}
                onChangeEmail={onChangeEmail}
                onChangePassword={onChangePassword}
                onSubmit={onSubmitAuth}
                onContinueAsGuest={onContinueAsGuest}
                onLogout={onLogout}
                onSwitchToLogin={onSwitchToLogin}
                onSwitchToRegister={onSwitchToRegister}
                onClose={closeAuthModal}
            />
        </div>
    );
};
