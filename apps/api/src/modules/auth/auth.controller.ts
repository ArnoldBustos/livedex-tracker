import type { Request, Response } from "express";
import prismaClient from "../../lib/prisma";

// loginWithEmail finds a user by email and returns a lightweight auth payload
// auth.routes.ts uses this controller for the first minimal login flow
// TODO: Replace this email-only lookup with real session auth during the auth migration.
export const loginWithEmail = async (request: Request, response: Response) => {
    const email =
        typeof request.body.email === "string"
            ? request.body.email.trim().toLowerCase()
            : "";

    if (!email) {
        response.status(400).json({
            error: "Email is required"
        });
        return;
    }

    const user = await prismaClient.user.findUnique({
        where: {
            email
        },
        select: {
            id: true,
            email: true,
            username: true
        }
    });

    if (!user) {
        response.status(404).json({
            error: "No user found for that email"
        });
        return;
    }

    response.status(200).json({
        user
    });
};
