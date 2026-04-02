import dotenv from "dotenv";
import prismaClient from "../lib/prisma";

dotenv.config();

const checkDevUser = async () => {
    const devUserId = process.env.DEV_USER_ID || "";

    console.log("DEV_USER_ID from env:", devUserId);

    const user = await prismaClient.user.findUnique({
        where: {
            id: devUserId
        }
    });

    console.log("Matching user:", JSON.stringify(user, null, 2));
};

checkDevUser()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prismaClient.$disconnect();
    });