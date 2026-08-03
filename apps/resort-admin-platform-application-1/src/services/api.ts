import i18n from "@/i18n";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const TOKEN_KEY = "access_token";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `${TOKEN_KEY}=${token}; path=/; SameSite=Lax`;
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

// Every request to this API requires Accept-Language, even endpoints that ignore its value.
function getAcceptLanguage(): string {
    if (typeof window === "undefined") return "en";
    return i18n.resolvedLanguage ?? i18n.language ?? "en";
}

export class ApiError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Accept-Language": getAcceptLanguage(),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = res.statusText;
        let code: string | undefined;
        try {
            const json = JSON.parse(text);
            message = json.message || json.error || text || res.statusText;
            code = json.error;
        } catch {
            message = text || res.statusText;
        }
        throw new ApiError(message || `Request failed: ${res.status}`, res.status, code);
    }

    if (res.status === 204) return undefined as T;

    return res.json();
}

export const api = {
    get: <T>(path: string, options?: RequestInit) =>
        apiFetch<T>(path, { ...options, method: "GET" }),

    post: <T>(path: string, body: unknown, options?: RequestInit) =>
        apiFetch<T>(path, {
            ...options,
            method: "POST",
            body: JSON.stringify(body),
        }),

    put: <T>(path: string, body: unknown, options?: RequestInit) =>
        apiFetch<T>(path, {
            ...options,
            method: "PUT",
            body: JSON.stringify(body),
        }),

    patch: <T>(path: string, body: unknown, options?: RequestInit) =>
        apiFetch<T>(path, {
            ...options,
            method: "PATCH",
            body: JSON.stringify(body),
        }),

    delete: <T>(path: string, options?: RequestInit) =>
        apiFetch<T>(path, { ...options, method: "DELETE" }),

    // Multipart form uploads never set Content-Type manually — the browser must set it (with the
    // boundary) itself, so this bypasses apiFetch's JSON-only header defaults entirely.
    postForm: async <T>(path: string, body: FormData): Promise<T> => {
        const token = getToken();
        const res = await fetch(`${BASE_URL}${path}`, {
            method: "POST",
            body,
            headers: {
                "Accept-Language": getAcceptLanguage(),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            let message = res.statusText;
            let code: string | undefined;
            try {
                const json = JSON.parse(text);
                message = json.message || json.error || text || res.statusText;
                code = json.error;
            } catch {
                message = text || res.statusText;
            }
            throw new ApiError(message || `Request failed: ${res.status}`, res.status, code);
        }

        if (res.status === 204) return undefined as T;

        return res.json();
    },
};
