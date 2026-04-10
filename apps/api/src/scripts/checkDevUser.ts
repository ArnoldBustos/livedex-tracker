import dotenv from "dotenv";
import prismaClient from "../lib/prisma";
import { LOCAL_DEV_ACCOUNT_EMAIL } from "../modules/auth/localDevAccount.service";

dotenv.config();

// checkDevUser verifies that the canonical local dev user and credential account exist in the database.
// local auth troubleshooting uses this so dev@example.com sign-in issues can be diagnosed without manual table inspection.
const checkDevUser = async () => {
    const user = await prismaClient.user.findUnique({
        where: {
            email: LOCAL_DEV_ACCOUNT_EMAIL
        }
    });

    if (!user) {
        console.log("Canonical local dev user was not found for email:", LOCAL_DEV_ACCOUNT_EMAIL);
        return;
    }

    const credentialAccount = await prismaClient.account.findFirst({
        where: {
            userId: user.id,
            providerId: "credential"
        },
        select: {
            id: true,
            userId: true,
            providerId: true,
            accountId: true,
            password: true,
            createdAt: true,
            updatedAt: true
        }
    });

    console.log("Canonical local dev user:", JSON.stringify(user, null, 2));
    console.log("Credential account summary:", JSON.stringify({
        exists: Boolean(credentialAccount),
        providerId: credentialAccount ? credentialAccount.providerId : null,
        accountId: credentialAccount ? credentialAccount.accountId : null,
        hasPassword: credentialAccount ? typeof credentialAccount.password === "string" && credentialAccount.password.length > 0 : false,
        createdAt: credentialAccount ? credentialAccount.createdAt : null,
        updatedAt: credentialAccount ? credentialAccount.updatedAt : null
    }, null, 2));
};

checkDevUser()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prismaClient.$disconnect();
    });
