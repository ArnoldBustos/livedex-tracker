import type { ChangeEvent } from "react";

type AuthMode = "login" | "register";

type LoginViewProps = {
    authMode: AuthMode;
    email: string;
    isSubmitting: boolean;
    errorMessage: string;
    onChangeEmail: (nextEmail: string) => void;
    onSubmit: () => void;
    onContinueAsGuest: () => void;
    onSwitchToLogin: () => void;
    onSwitchToRegister: () => void;
};

// LoginView renders the first-entry auth screen for returning users and guests
// App.tsx uses this as the top-level screen before the upload or dashboard flows
export const LoginView = ({
    authMode,
    email,
    isSubmitting,
    errorMessage,
    onChangeEmail,
    onSubmit,
    onContinueAsGuest,
    onSwitchToLogin,
    onSwitchToRegister
}: LoginViewProps) => {
    // handleEmailChange updates the parent-owned email state as the user types
    // this keeps the form controlled by App.tsx
    const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChangeEmail(event.target.value);
    };

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

                <main className="flex-1 rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                                {authMode === "login" ? "Welcome Back" : "Create Account"}
                            </div>

                            <h2 className="mt-2 text-[44px] font-extrabold tracking-tight text-[#0f172a]">
                                {authMode === "login"
                                    ? "Sign in to your tracker"
                                    : "Create your tracker account"}
                            </h2>

                            <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-[#656554]">
                                {authMode === "login"
                                    ? "Enter your email to load your saved profiles. You can also continue as a guest and upload a save file without signing in."
                                    : "Create an account to save multiple profiles, keep progress across devices, and move beyond a temporary guest session."}
                            </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-green-700">
                            Beta
                        </span>
                    </div>

                    <div className="mt-8 grid gap-6">
                        <section className="rounded-2xl border border-[rgba(130,129,111,0.18)] bg-gray-50 p-5">
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

                            <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                    className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
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

                                {authMode === "login" ? (
                                    <button
                                        className="rounded-xl border border-[rgba(130,129,111,0.18)] bg-white px-5 py-3 text-sm font-semibold text-[#38392a] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        type="button"
                                        onClick={onContinueAsGuest}
                                        disabled={isSubmitting}
                                    >
                                        Continue as Guest
                                    </button>
                                ) : null}
                            </div>

                            <div className="mt-4 text-[13px] font-medium text-[#656554]">
                                {authMode === "login" ? (
                                    <button
                                        className="text-green-700 transition hover:text-green-800"
                                        type="button"
                                        onClick={onSwitchToRegister}
                                        disabled={isSubmitting}
                                    >
                                        Need an account? Create one
                                    </button>
                                ) : (
                                    <button
                                        className="text-green-700 transition hover:text-green-800"
                                        type="button"
                                        onClick={onSwitchToLogin}
                                        disabled={isSubmitting}
                                    >
                                        Already have an account? Sign in
                                    </button>
                                )}
                            </div>
                        </section>

                        <section className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-[rgba(130,129,111,0.18)] bg-white p-5">
                                <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#656554]">
                                    Upload a Save
                                </div>

                                <p className="mt-3 text-[13px] leading-6 text-[#656554]">
                                    Import a Gen 3 save and keep it tied to your account so you can
                                    revisit it later.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-[rgba(130,129,111,0.18)] bg-white p-5">
                                <div className="text-[10px] font-extrafbold uppercase tracking-[0.12em] text-[#656554]">
                                    Manual Entry
                                </div>

                                <p className="mt-3 text-[13px] leading-6 text-[#656554]">
                                    Build a dex manually by choosing a game, entering trainer info,
                                    and tracking captures without uploading a save.
                                </p>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};