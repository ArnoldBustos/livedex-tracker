import dotenv from "dotenv";

dotenv.config();

export const env = {
    DEV_USER_ID: process.env.DEV_USER_ID || "",
    DATABASE_URL: process.env.DATABASE_URL || "",
    PORT: process.env.PORT || "4000",
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "local"
};