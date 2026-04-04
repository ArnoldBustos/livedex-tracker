const API_BASE_URL = "http://localhost:4000";

export type ApiClientUser = {
    id: string;
    email: string;
};

// buildAuthHeaders returns the user header values expected by the backend
// api request helpers call this so auth wiring stays in one place
const buildAuthHeaders = (
    currentUser?: ApiClientUser | null
): Record<string, string> => {
    if (!currentUser) {
        return {};
    }

    return {
        "x-user-id": currentUser.id,
        "x-user-email": currentUser.email
    };
};

// parseJsonResponse reads a JSON response body when one exists
// apiRequest uses this so all requests share the same response parsing path
const parseJsonResponse = async <T>(response: Response): Promise<T | null> => {
    const responseText = await response.text();

    if (!responseText) {
        return null;
    }

    return JSON.parse(responseText) as T;
};

type ApiRequestOptions = {
    method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
    currentUser?: ApiClientUser | null;
    body?: BodyInit | null;
    headers?: Record<string, string>;
};

// apiRequest performs a fetch with shared base url, auth headers, and error handling
// feature api files such as uploads.ts call this instead of using raw fetch directly
export const apiRequest = async <T>(
    path: string,
    options?: ApiRequestOptions
): Promise<T> => {
    const method = options?.method ?? "GET";
    const currentUser = options?.currentUser ?? null;
    const body = options?.body ?? null;
    const extraHeaders = options?.headers ?? {};

    const requestHeaders: Record<string, string> = {
        ...buildAuthHeaders(currentUser),
        ...extraHeaders
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        body,
        headers: requestHeaders
    });

    const parsedBody = await parseJsonResponse<T | { error?: string }>(response);

    if (!response.ok) {
        if (
            parsedBody &&
            typeof parsedBody === "object" &&
            "error" in parsedBody &&
            parsedBody.error
        ) {
            throw new Error(parsedBody.error);
        }

        throw new Error(`Request failed: ${response.status}`);
    }

    return parsedBody as T;
};