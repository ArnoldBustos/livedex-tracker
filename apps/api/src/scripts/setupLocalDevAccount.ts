import { env } from "../config/env";
import prismaClient from "../lib/prisma";
import { ensureLocalDevAccount } from "../modules/auth/localDevAccount.service";

// setupLocalDevAccount creates or confirms the canonical local development user when the dev-only flag is enabled.
// package.json exposes this script so local auth migration prep has one explicit entry point before real auth lands.
const setupLocalDevAccount = async () => {
    if (!env.ENABLE_LOCAL_DEV_ACCOUNT) {
        console.log("Skipped local dev account setup because ENABLE_LOCAL_DEV_ACCOUNT is not true.");
        return;
    }

    const bootstrapResult = await ensureLocalDevAccount();

    console.log("Local dev account is ready:", JSON.stringify(bootstrapResult, null, 2));
    console.log("Configured local dev sign-in email:", bootstrapResult.email);
    console.log("Configured local dev sign-in password from env key: LOCAL_DEV_ACCOUNT_PASSWORD");
};

setupLocalDevAccount()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prismaClient.$disconnect();
    });
