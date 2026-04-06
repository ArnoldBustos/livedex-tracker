import type { ChangeEvent } from "react";

export type AuthPanelMode = "login" | "register";

type AuthPanelProps = {
    authMode: AuthPanelMode;
    isSignedIn: boolean;
    currentUserEmail: string;
    email: string;
    isSubmitting: boolean;
    errorMessage: string;
    showContinueAsGuest: boolean;
    onChangeEmail: (nextEmail: string) => void;
    onSubmit: () => void;
    onContinueAsGuest: () => void;
    onLogout: () => void;
    onSwitchToLogin: () => void;
    onSwitchToRegister: () => void;
};

// AuthPanel renders the reusable account actions used by entry and legacy login layouts.
// EntryView and LoginView compose this so auth UI stays separate from upload/manual orchestration.
export const AuthPanel = ({
    authMode,
    isSignedIn,
    currentUserEmail,
    email,
    isSubmitting,
    errorMessage,
    showContinueAsGuest,
    onChangeEmail,
    onSubmit,
    onContinueAsGuest,
    onLogout,
    onSwitchToLogin,
    onSwitchToRegister
}: AuthPanelProps) => {
    // handleEmailChange forwards typed email updates to the parent-owned auth state.
    // App.tsx provides the setter so this panel stays reusable and controlled.
    const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChangeEmail(event.target.value);
    };

    return (
        <aside className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                Account
            </div>

            <div className="mt-4">
                <h2 className="text-[22px] font-extrabold tracking-tight text-[#0f172a]">
                    {isSignedIn
                        ? "You're signed in"
                        : authMode === "login"
                            ? "Sign in to your tracker"
                            : "Create your tracker account"}
                </h2>

                <p className="mt-3 text-[13px] leading-6 text-[#656554]">
                    {isSignedIn
                        ? "Your account-backed saved profiles are available from this entry screen."
                        : authMode === "login"
                            ? "Sign in to open saved profiles across devices without leaving the upload and manual entry screen."
                            : "Create an account to keep uploads and profiles tied to your email instead of a temporary local session."}
                </p>
            </div>

            <section className="mt-6 rounded-2xl border border-[rgba(130,129,111,0.18)] bg-gray-50 p-4">
                {isSignedIn ? (
                    <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                            Signed-In Account
                        </div>

                        <div className="mt-4 rounded-xl bg-white px-4 py-3">
                            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                                Email
                            </div>

                            <div className="mt-2 text-[14px] font-medium text-[#38392a]">
                                {currentUserEmail}
                            </div>
                        </div>

                        <button
                            className="mt-4 min-h-[48px] w-full rounded-xl border border-[rgba(130,129,111,0.18)] bg-white px-5 py-3 text-sm font-semibold text-[#38392a] transition hover:bg-gray-100"
                            type="button"
                            onClick={onLogout}
                        >
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                            {authMode === "login" ? "Returning User" : "New Account"}
                        </div>

                        <label className="mt-4 block">
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                                Email
                            </div>

                            <input
                                className="mt-2 w-full rounded-xl border border-[rgba(130,129,111,0.18)] bg-white px-4 py-3 text-[14px] font-medium text-[#38392a] outline-none transition focus:border-[rgba(22,163,74,0.45)]"
                                type="email"
                                placeholder="dev@example.com"
                                value={email}
                                onChange={handleEmailChange}
                                disabled={isSubmitting}
                            />
                        </label>

                        {errorMessage ? (
                            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                                {errorMessage}
                            </div>
                        ) : null}

                        <div className="mt-4 grid gap-3">
                            <button
                                className="min-h-[48px] rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                                type="button"
                                onClick={onSubmit}
                                disabled={isSubmitting || !email.trim()}
                            >
                                {isSubmitting
                                    ? authMode === "login"
                                        ? "Signing in..."
                                        : "Creating account..."
                                    : authMode === "login"
                                        ? "Sign In"
                                        : "Create Account"}
                            </button>

                            {showContinueAsGuest ? (
                                <button
                                    className="min-h-[48px] rounded-xl border border-[rgba(130,129,111,0.18)] bg-white px-5 py-3 text-sm font-semibold text-[#38392a] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    type="button"
                                    onClick={onContinueAsGuest}
                                    disabled={isSubmitting}
                                >
                                    Continue as Guest
                                </button>
                            ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-[13px] font-medium">
                            <button
                                className={`rounded-full px-3 py-2 transition ${authMode === "login"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-white text-[#656554] hover:text-[#38392a]"
                                    }`}
                                type="button"
                                onClick={onSwitchToLogin}
                                disabled={isSubmitting}
                            >
                                Sign In
                            </button>

                            <button
                                className={`rounded-full px-3 py-2 transition ${authMode === "register"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-white text-[#656554] hover:text-[#38392a]"
                                    }`}
                                type="button"
                                onClick={onSwitchToRegister}
                                disabled={isSubmitting}
                            >
                                Register
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <section className="mt-4 rounded-2xl bg-[#f6f5dc] p-4">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                    Entry Options
                </div>

                <p className="mt-3 text-[12px] leading-6 text-[#656554]">
                    Upload a save, start a manual tracker, or manage account access without leaving this screen.
                </p>
            </section>
        </aside>
    );
};
