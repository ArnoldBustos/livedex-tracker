import dotenv from "dotenv";

dotenv.config();

// getIsEnabledFlag normalizes one env flag so local-dev setup toggles stay explicit.
// env.ts uses this when parsing boolean-like flags for scripts and future auth bootstrapping.
const getIsEnabledFlag = (value: string | undefined) => {
    return value === "true";
};

export const env = {
    // ENABLE_LOCAL_DEV_ACCOUNT controls whether dev-only account setup helpers should run.
    // seed.ts and setupLocalDevAccount.ts read this so local bootstrapping stays isolated from general app config.
    ENABLE_LOCAL_DEV_ACCOUNT: getIsEnabledFlag(process.env.ENABLE_LOCAL_DEV_ACCOUNT),
    DEV_USER_ID: process.env.DEV_USER_ID || "",
    DATABASE_URL: process.env.DATABASE_URL || "",
    PORT: process.env.PORT || "4000",
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "local"
};
