import prismaClient from "../lib/prisma";

const seed = async () => {
    const existingUser = await prismaClient.user.findUnique({
        where: {
            email: "dev@example.com"
        }
    });

    if (existingUser) {
        console.log("Dev user already exists:", existingUser.id);
        return;
    }

    const createdUser = await prismaClient.user.create({
        data: {
            email: "dev@example.com",
            username: "devuser"
        }
    });

    console.log("Created dev user:", createdUser.id);
};

seed()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prismaClient.$disconnect();
    });