import cockpit from "cockpit";

import { getCubeApiConfig, refreshCubeApiConfig, resetCubeApiConfigCache } from "./config.ts";
import { getPreviewCubeApiResponse } from "./preview.ts";

interface CubeApiRequestOptions {
    method?: "GET" | "POST";
    body?: unknown;
    connectTimeoutSeconds?: number;
    maxTimeSeconds?: number;
}

function joinUrl(baseUrl: string, path: string): string {
    return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

type CubeApiConfigValue = Awaited<ReturnType<typeof getCubeApiConfig>>;

function responseRecord(response: unknown): Record<string, unknown> | null {
    if (typeof response !== "object" || response === null || Array.isArray(response)) {
        return null;
    }

    return response as Record<string, unknown>;
}

function stringValue(value: unknown): string {
    return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function responseMessage(response: unknown): string {
    const record = responseRecord(response);

    if (!record) {
        return "";
    }

    return [
        stringValue(record.message),
        stringValue(record.error),
        stringValue(record.val),
    ].filter(Boolean).join(" ");
}

function isAuthTokenError(response: unknown): boolean {
    const record = responseRecord(response);
    const code = stringValue(record?.code);
    const message = responseMessage(response).toLowerCase();

    return (
        code === "401" ||
        message.includes("invalid token") ||
        message.includes("token expired") ||
        message.includes("bearer token required") ||
        message.includes("authorization header required") ||
        message.includes("missing authorization")
    );
}

async function runCubeApiRequest(
    path: string,
    options: CubeApiRequestOptions,
    config: CubeApiConfigValue
): Promise<unknown> {
    const method = options.method ?? "GET";
    const curlArgs = [
        "curl",
        "-sS",
        "--connect-timeout",
        String(options.connectTimeoutSeconds ?? 5),
        "--max-time",
        String(options.maxTimeSeconds ?? 15),
        "-X",
        method,
        joinUrl(config.baseUrl, path),
        "-H",
        "accept: application/json",
        "-H",
        `Authorization: Bearer ${config.token}`,
    ];

    if (options.body !== undefined) {
        curlArgs.push(
            "-H",
            "Content-Type: application/json",
            "-d",
            JSON.stringify(options.body)
        );
    }

    const stdout = await cockpit.spawn(curlArgs);

    return JSON.parse(stdout);
}

export async function requestCubeApi<T>(
    path: string,
    options: CubeApiRequestOptions = {}
): Promise<T> {
    const previewResponse = getPreviewCubeApiResponse<T>(path, options);

    if (previewResponse !== undefined) {
        return previewResponse;
    }

    const response = await runCubeApiRequest(path, options, await getCubeApiConfig());

    if (isAuthTokenError(response)) {
        resetCubeApiConfigCache();
        const refreshedResponse = await runCubeApiRequest(path, options, await refreshCubeApiConfig());

        return refreshedResponse as T;
    }

    return response as T;
}
