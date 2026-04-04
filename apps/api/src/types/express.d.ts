// This file extends the Express Request type with app-specific user data.
// Auth middleware will attach the authenticated user here for controllers to read.

export { };

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
            };
        }
    }
}