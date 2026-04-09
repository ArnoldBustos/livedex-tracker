import prismaClient from "../../lib/prisma";

// getNormalizedUsernameCandidate converts one email address into a username-friendly base value for sign-up.
// auth.controller.ts uses this so the phase-1 UI can stay email-plus-password while the existing User.username constraint stays satisfied.
const getNormalizedUsernameCandidate = (email: string) => {
    const emailPrefix = email.split("@")[0] || "";
    const normalizedCandidate = emailPrefix
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");

    if (normalizedCandidate) {
        return normalizedCandidate;
    }

    return "trainer";
};

// getAvailableUsernameForEmail finds one unique username derived from the sign-up email address.
// auth.controller.ts uses this so Better Auth can create users against the existing unique username column without extra UI fields yet.
export const getAvailableUsernameForEmail = async (email: string) => {
    const baseUsername = getNormalizedUsernameCandidate(email);
    let attemptNumber = 0;

    while (true) {
        const nextUsername =
            attemptNumber === 0
                ? baseUsername
                : `${baseUsername}${attemptNumber.toString()}`;
        const existingUser = await prismaClient.user.findUnique({
            where: {
                username: nextUsername
            },
            select: {
                id: true
            }
        });

        if (!existingUser) {
            return nextUsername;
        }

        attemptNumber += 1;
    }
};

// getStoredUserFromAuthUser maps the Better Auth user payload onto the app's shared signed-in user shape.
// auth.controller.ts returns this so the frontend can keep its existing signed-in session state contract.
export const getStoredUserFromAuthUser = (authUser: {
    id: string;
    email: string;
    name: string;
}) => {
    return {
        id: authUser.id,
        email: authUser.email,
        username: authUser.name
    };
};
