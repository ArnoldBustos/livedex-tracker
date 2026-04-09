import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(nodeScrypt);
const AUTH_PASSWORD_HASH_PREFIX = "livedex-scrypt-v1";
const AUTH_PASSWORD_HASH_KEY_LENGTH = 64;

// getDerivedPasswordKey hashes one password with one salt using the local Better Auth-compatible scrypt settings.
// passwordHash.service.ts uses this so runtime sign-in checks and dev credential bootstrapping share one hashing implementation.
const getDerivedPasswordKey = async ({
    password,
    salt
}: {
    password: string;
    salt: string;
}) => {
    const derivedKey = await scrypt(password, salt, AUTH_PASSWORD_HASH_KEY_LENGTH);
    return Buffer.from(derivedKey as ArrayBuffer);
};

// hashAuthPassword creates the stored password format used by Better Auth email/password sign-in in this repo.
// betterAuth.ts and localDevAccount.service.ts call this so sign-up and dev credential bootstrapping remain aligned.
export const hashAuthPassword = async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await getDerivedPasswordKey({
        password,
        salt
    });

    return `${AUTH_PASSWORD_HASH_PREFIX}:${salt}:${derivedKey.toString("hex")}`;
};

// verifyAuthPassword validates one stored password hash against one plain password attempt.
// betterAuth.ts calls this so cookie-backed sign-in can reuse the same hash format created during bootstrapping.
export const verifyAuthPassword = async ({
    hash,
    password
}: {
    hash: string;
    password: string;
}) => {
    const hashParts = hash.split(":");

    if (hashParts.length !== 3) {
        return false;
    }

    if (hashParts[0] !== AUTH_PASSWORD_HASH_PREFIX) {
        return false;
    }

    const salt = hashParts[1];
    const storedDigest = hashParts[2];
    const derivedKey = await getDerivedPasswordKey({
        password,
        salt
    });
    const storedBuffer = Buffer.from(storedDigest, "hex");

    if (storedBuffer.length !== derivedKey.length) {
        return false;
    }

    return timingSafeEqual(storedBuffer, derivedKey);
};
