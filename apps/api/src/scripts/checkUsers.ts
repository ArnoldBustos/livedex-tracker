import prismaClient from "../lib/prisma";

const checkUsers = async () => {
    const users = await prismaClient.user.findMany({
        orderBy: {
            createdAt: "asc"
        }
    });

    console.log(JSON.stringify(users, null, 2));
};

checkUsers()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prismaClient.$disconnect();
    });