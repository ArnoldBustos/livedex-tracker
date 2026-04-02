import prismaClient from "../lib/prisma";

const clearDex = async () => {
    const deletedEntries = await prismaClient.userDexEntry.deleteMany({
        where: {
            user: {
                email: "dev@example.com"
            }
        }
    });

    console.log("Deleted dex entries:", deletedEntries.count);
};

clearDex()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prismaClient.$disconnect();
    });