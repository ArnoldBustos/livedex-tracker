import dotenv from "dotenv";

dotenv.config();

// getIsEnabledFlag normalizes one env flag so local-dev setup toggles stay explicit.
// env.ts uses this when parsing boolean-like flags for scripts and future auth bootstrapping.
const getIsEnabledFlag = (value: string | undefined) => {
    return value === "true";
};

// getDefaultLocalDevAccountEnabled preserves the local dev auth path unless production explicitly disables it.
// env.ts uses this so local Better Auth testing stays available even when apps/api/.env omits the dev-only flag.
const getDefaultLocalDevAccountEnabled = () => {
    return process.env.NODE_ENV !== "production";
};

export const env = {
    // ENABLE_LOCAL_DEV_ACCOUNT controls whether dev-only account setup helpers should run.
    // seed.ts, setupLocalDevAccount.ts, and auth.controller.ts read this so local bootstrapping stays available unless production disables it.
    ENABLE_LOCAL_DEV_ACCOUNT:
        typeof process.env.ENABLE_LOCAL_DEV_ACCOUNT === "string"
            ? getIsEnabledFlag(process.env.ENABLE_LOCAL_DEV_ACCOUNT)
            : getDefaultLocalDevAccountEnabled(),
    // BETTER_AUTH_SECRET stores the Better Auth signing secret for local and deployed session cookies.
    // betterAuth.ts reads this so session auth can issue and verify cookies consistently.
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "local-dev-better-auth-secret-change-me",
    // BETTER_AUTH_URL stores the mounted Better Auth base URL including its auth path prefix.
    // betterAuth.ts reads this so generated auth URLs match the Express mount path.
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:4000/api/auth",
    DEV_USER_ID: process.env.DEV_USER_ID || "",
    DATABASE_URL: process.env.DATABASE_URL || "",
    // LOCAL_DEV_ACCOUNT_PASSWORD stores the dev-only credential used to sign in as dev@example.com after the auth migration.
    // localDevAccount.service.ts reads this when the dev-only gate is enabled and the canonical local account needs a credential.
    LOCAL_DEV_ACCOUNT_PASSWORD: process.env.LOCAL_DEV_ACCOUNT_PASSWORD || "devpassword1234",
    PORT: process.env.PORT || "4000",
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "local",
    // WEB_ORIGIN stores the web app origin allowed to make credentialed auth requests to the API.
    // app.ts and betterAuth.ts read this so CORS and Better Auth origin checks stay aligned.
    WEB_ORIGIN: process.env.WEB_ORIGIN || "http://localhost:5173"
};
