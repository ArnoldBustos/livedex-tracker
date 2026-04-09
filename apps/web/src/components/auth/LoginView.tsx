import { AuthPanel } from "./AuthPanel";
import type { AuthPanelMode } from "./AuthPanel";

type LoginViewProps = {
    authMode: AuthPanelMode;
    email: string;
    password: string;
    isSubmitting: boolean;
    errorMessage: string;
    onChangeEmail: (nextEmail: string) => void;
    onChangePassword: (nextPassword: string) => void;
    onSubmit: () => void;
    onContinueAsGuest: () => void;
    onSwitchToLogin: () => void;
    onSwitchToRegister: () => void;
};

// LoginView renders the first-entry auth screen for returning users and guests
// Legacy auth-only routes can still compose this wrapper while App.tsx now prefers EntryView.
export const LoginView = ({
    authMode,
    email,
    password,
    isSubmitting,
    errorMessage,
    onChangeEmail,
    onChangePassword,
    onSubmit,
    onContinueAsGuest,
    onSwitchToLogin,
    onSwitchToRegister
}: LoginViewProps) => {
    return (
        <div className="min-h-screen bg-[#f3f4f6] px-6 py-12 text-[#38392a]">
            <div className="mx-auto flex max-w-[980px] gap-4">
                <aside className="w-[240px] rounded-2xl bg-white p-4 shadow-sm">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                        Account
                    </div>

                    <div className="mt-4">
                        <h1 className="text-[16px] font-extrabold text-[#0f172a]">
                            LiveDex Tracker
                        </h1>

                        <p className="mt-3 text-[12px] leading-6 text-[#656554]">
                            Sign in to load saved profiles across devices, track progress over time,
                            and manage multiple playthroughs in one place.
                        </p>
                    </div>

                    <div className="mt-6 rounded-xl bg-gray-50 p-4">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                            Coming Next
                        </div>

                        <p className="mt-3 text-[12px] leading-6 text-[#656554]">
                            Manual dex entry, shiny tracking, and profile-based progress tools can
                            plug into this flow later.
                        </p>
                    </div>
                </aside>

                <main className="flex-1">
                    <AuthPanel
                        authMode={authMode}
                        isSignedIn={false}
                        currentUserEmail=""
                        email={email}
                        password={password}
                        isSubmitting={isSubmitting}
                        errorMessage={errorMessage}
                        showContinueAsGuest={true}
                        onChangeEmail={onChangeEmail}
                        onChangePassword={onChangePassword}
                        onSubmit={onSubmit}
                        onContinueAsGuest={onContinueAsGuest}
                        onLogout={() => {
                            return;
                        }}
                        onSwitchToLogin={onSwitchToLogin}
                        onSwitchToRegister={onSwitchToRegister}
                    />
                </main>
            </div>
        </div>
    );
};
