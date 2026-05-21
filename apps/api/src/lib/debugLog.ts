import { env } from "../config/env";

export const logParseDebug = (...args: Parameters<typeof console.log>) => {
    if (env.ENABLE_PARSE_DEBUG_LOGS) {
        console.log(...args);
    }
};
