import { useState } from "react";
import type { ChangeEvent } from "react";

export type AuthPanelMode = "login" | "register";

type AuthPanelProps = {
    authMode: AuthPanelMode;
    isSignedIn: boolean;
    currentUserEmail: string;
    email: string;
    password: string;
    isSubmitting: boolean;
    errorMessage: string;
    showContinueAsGuest: boolean;
    showEntryOptionsSection?: boolean;
    showModeToggleRow?: boolean;
    onChangeEmail: (nextEmail: string) => void;
    onChangePassword: (nextPassword: string) => void;
    onSubmit: () => void;
    onContinueAsGuest: () => void;
    onLogout: () => void;
    onSwitchToLogin: () => void;
    onSwitchToRegister: () => void;
};

type PasswordFieldProps = {
    password: string;
    isPasswordVisible: boolean;
    isSubmitting: boolean;
    onChangePassword: (nextPassword: string) => void;
    onTogglePasswordVisibility: () => void;
};

// VisiblePasswordIcon renders the eye icon used when the password is currently shown.
// PasswordField displays this icon so the toggle state is recognizable without text labels.
const VisiblePasswordIcon = () => {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12C3.85 8.48 7.43 6 12 6C16.57 6 20.15 8.48 22 12C20.15 15.52 16.57 18 12 18C7.43 18 3.85 15.52 2 12Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
};

// HiddenPasswordIcon renders the crossed-eye icon used when the password is currently masked.
// PasswordField displays this icon so the toggle reflects the hidden-password state at a glance.
const HiddenPasswordIcon = () => {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 3L21 21" />
            <path d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42" />
            <path d="M9.88 5.09C10.56 4.97 11.27 4.9 12 4.9C16.57 4.9 20.15 7.38 22 10.9C21.14 12.54 19.93 13.95 18.46 15.02" />
            <path d="M6.12 6.13C4.39 7.18 2.96 8.82 2 10.9C3.85 14.42 7.43 16.9 12 16.9C13.37 16.9 14.66 16.68 15.83 16.28" />
        </svg>
    );
};

// PasswordField renders the shared password input and visibility toggle used by auth forms.
// AuthPanel composes this helper so login and registration keep one password-field implementation.
const PasswordField = ({
    password,
    isPasswordVisible,
    isSubmitting,
    onChangePassword,
    onTogglePasswordVisibility
}: PasswordFieldProps) => {
    // handlePasswordChange forwards password typing to the parent-controlled auth state.
    // AuthPanel passes its setter through so this helper stays modular and presentation-focused.
    const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChangePassword(event.target.value);
    };

    return (
        <label className="mt-4 block">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                Password
            </div>

            <div className="relative mt-2">
                <input
                    className="w-full rounded-xl border border-[rgba(130,129,111,0.18)] bg-white px-4 py-3 pr-14 text-[14px] font-medium text-[#38392a] outline-none transition focus:border-green-700 focus:ring-2 focus:ring-[rgba(21,128,61,0.16)]"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isSubmitting}
                />

                <button
                    className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#38392a] transition hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                    aria-pressed={isPasswordVisible}
                    onClick={onTogglePasswordVisibility}
                    disabled={isSubmitting}
                >
                    {isPasswordVisible ? <VisiblePasswordIcon /> : <HiddenPasswordIcon />}
                </button>
            </div>
        </label>
    );
};

// AuthPanel renders the reusable account actions used by entry and legacy login layouts.
// EntryView and LoginView compose this so auth UI stays separate from upload/manual orchestration.
export const AuthPanel = ({
    authMode,
    isSignedIn,
    currentUserEmail,
    email,
    password,
    isSubmitting,
    errorMessage,
    showContinueAsGuest,
    showEntryOptionsSection = true,
    showModeToggleRow = true,
    onChangeEmail,
    onChangePassword,
    onSubmit,
    onContinueAsGuest,
    onLogout,
    onSwitchToLogin,
    onSwitchToRegister
}: AuthPanelProps) => {
    // isPasswordVisible stores whether the shared auth password field should show plain text.
    // AuthPanel owns this UI-only state so both login and registration gain the toggle without parent changes.
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // handleEmailChange forwards typed email updates to the parent-owned auth state.
    // App.tsx provides the setter so this panel stays reusable and controlled.
    const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChangeEmail(event.target.value);
    };

    // handleTogglePasswordVisibility switches the shared password field between masked and visible text.
    // PasswordField calls this so the toggle remains local UI state rather than part of auth submission state.
    const handleTogglePasswordVisibility = () => {
        setIsPasswordVisible((currentIsPasswordVisible) => {
            return !currentIsPasswordVisible;
        });
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
                                className="mt-2 w-full rounded-xl border border-[rgba(130,129,111,0.18)] bg-white px-4 py-3 text-[14px] font-medium text-[#38392a] outline-none transition focus:border-green-700 focus:ring-2 focus:ring-[rgba(21,128,61,0.16)]"
                                type="email"
                                placeholder="dev@example.com"
                                value={email}
                                onChange={handleEmailChange}
                                disabled={isSubmitting}
                            />
                        </label>

                        <PasswordField
                            password={password}
                            isPasswordVisible={isPasswordVisible}
                            isSubmitting={isSubmitting}
                            onChangePassword={onChangePassword}
                            onTogglePasswordVisibility={handleTogglePasswordVisibility}
                        />

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
                                disabled={isSubmitting || !email.trim() || !password.trim()}
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

                        {showModeToggleRow ? (
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#656554]">
                                <span>
                                    {authMode === "login" ? "Need an account?" : "Already have an account?"}
                                </span>

                                <button
                                    className="rounded-full border border-[rgba(130,129,111,0.18)] bg-white px-3 py-2 text-[#38392a] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    type="button"
                                    onClick={authMode === "login" ? onSwitchToRegister : onSwitchToLogin}
                                    disabled={isSubmitting}
                                >
                                    {authMode === "login" ? "Create Account" : "Sign In"}
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}
            </section>

            {showEntryOptionsSection ? (
                <section className="mt-4 rounded-2xl bg-[#f6f5dc] p-4">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                        Entry Options
                    </div>

                    <p className="mt-3 text-[12px] leading-6 text-[#656554]">
                        Upload a save, start a manual tracker, or manage account access without leaving this screen.
                    </p>
                </section>
            ) : null}
        </aside>
    );
};
