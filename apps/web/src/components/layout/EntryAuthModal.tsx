import { AuthPanel } from "../auth/AuthPanel";
import type { AuthPanelMode } from "../auth/AuthPanel";

type EntryAuthModalProps = {
    isOpen: boolean;
    authMode: AuthPanelMode;
    currentUserEmail: string;
    email: string;
    password: string;
    isSubmitting: boolean;
    errorMessage: string;
    onChangeEmail: (nextEmail: string) => void;
    onChangePassword: (nextPassword: string) => void;
    onSubmit: () => void;
    onContinueAsGuest: () => void;
    onLogout: () => void;
    onSwitchToLogin: () => void;
    onSwitchToRegister: () => void;
    onClose: () => void;
};

// EntryAuthModal renders the centered auth overlay used by the entry page topbar actions.
// EntryView opens this so sign-in and registration reuse the existing AuthPanel logic without keeping auth controls on the page itself.
export const EntryAuthModal = ({
    isOpen,
    authMode,
    currentUserEmail,
    email,
    password,
    isSubmitting,
    errorMessage,
    onChangeEmail,
    onChangePassword,
    onSubmit,
    onContinueAsGuest,
    onLogout,
    onSwitchToLogin,
    onSwitchToRegister,
    onClose
}: EntryAuthModalProps) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.42)] px-4 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[520px]"
                onClick={(event) => {
                    event.stopPropagation();
                }}
            >
                <button
                    type="button"
                    className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(130,129,111,0.18)] bg-white text-lg font-medium text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                    onClick={onClose}
                >
                    x
                </button>

                <AuthPanel
                    authMode={authMode}
                    isSignedIn={false}
                    currentUserEmail={currentUserEmail}
                    email={email}
                    password={password}
                    isSubmitting={isSubmitting}
                    errorMessage={errorMessage}
                    showContinueAsGuest={false}
                    showEntryOptionsSection={false}
                    showModeToggleRow={true}
                    onChangeEmail={onChangeEmail}
                    onChangePassword={onChangePassword}
                    onSubmit={onSubmit}
                    onContinueAsGuest={onContinueAsGuest}
                    onLogout={onLogout}
                    onSwitchToLogin={onSwitchToLogin}
                    onSwitchToRegister={onSwitchToRegister}
                />
            </div>
        </div>
    );
};
