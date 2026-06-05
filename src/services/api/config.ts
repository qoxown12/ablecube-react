import cockpit from "cockpit";

const CUBE_CONF_PATHS = [
  "/etc/ablestack/cube.conf",
  "/root/ablecube-react/cube.conf",
];
const STATUS_CARD_REFRESH_INTERVAL_CONF_KEY = "DEFAULT_STATUS_CARD_REFRESH_INTERVAL_SECONDS";
const AUTH_TOKEN_HELPER = "/usr/bin/ablestack-auth-token";

export const FALLBACK_STATUS_CARD_REFRESH_INTERVAL_SECONDS = 10;

interface CubeApiConfig {
  baseUrl: string;
  token: string;
}

let cubeConfPromise: Promise<Record<string, string>> | null = null;
let cubeApiConfigPromise: Promise<CubeApiConfig> | null = null;

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, "");
}

function parseCubeConf(content: string): Record<string, string> {
  const config: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = stripQuotes(trimmed.slice(separatorIndex + 1).trim());

    if (key && value) {
      config[key] = value;
    }
  }

  return config;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function normalizeAuthorizationToken(value: string): string {
  const trimmed = value.trim();

  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice("bearer ".length).trim();
  }

  return trimmed;
}

function parseAuthTokenHelperOutput(stdout: string): string {
  const trimmed = stdout.trim();

  if (!trimmed) {
    throw new Error("ablestack-auth-token 실행 결과가 비어 있습니다.");
  }

  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as {
      authorization?: unknown;
      access_token?: unknown;
    };

    if (typeof parsed.authorization === "string" && parsed.authorization.trim()) {
      return normalizeAuthorizationToken(parsed.authorization);
    }

    if (typeof parsed.access_token === "string" && parsed.access_token.trim()) {
      return parsed.access_token.trim();
    }

    throw new Error("ablestack-auth-token 응답에 authorization 또는 access_token 값이 없습니다.");
  }

  return normalizeAuthorizationToken(trimmed);
}

async function issueCubeApiToken(): Promise<string> {
  try {
    const stdout = await cockpit.spawn([AUTH_TOKEN_HELPER, "--plain"], { superuser: "try" });
    return parseAuthTokenHelperOutput(stdout);
  } catch (error) {
    throw new Error(
      `cube.conf에 CUBE_API_TOKEN 값이 없고 ${AUTH_TOKEN_HELPER} 실행도 실패했습니다. ${String(error)}`
    );
  }
}

async function readCubeConf(): Promise<string> {
  const errors: string[] = [];

  for (const path of CUBE_CONF_PATHS) {
    try {
      const content = await cockpit.file(path, { superuser: "try" }).read();

      if (typeof content === "string") {
        return content;
      }

      errors.push(`${path}: 파일이 없습니다.`);
    } catch (error) {
      errors.push(`${path}: ${String(error)}`);
    }
  }

  throw new Error(`cube.conf 파일을 읽을 수 없습니다. ${errors.join("; ")}`);
}

async function getCubeConf(): Promise<Record<string, string>> {
  if (!cubeConfPromise) {
    cubeConfPromise = readCubeConf().then(parseCubeConf);
  }

  return cubeConfPromise;
}

function parsePositiveIntervalSeconds(value: string | undefined): number {
  if (!value) {
    return FALLBACK_STATUS_CARD_REFRESH_INTERVAL_SECONDS;
  }

  const intervalSeconds = Number(value.replace(/_/g, ""));

  if (!Number.isFinite(intervalSeconds) || intervalSeconds <= 0) {
    return FALLBACK_STATUS_CARD_REFRESH_INTERVAL_SECONDS;
  }

  return intervalSeconds;
}

export async function getStatusCardRefreshIntervalMs(): Promise<number> {
  const config = await getCubeConf();
  const intervalSeconds = parsePositiveIntervalSeconds(
    config[STATUS_CARD_REFRESH_INTERVAL_CONF_KEY]
  );

  return Math.round(intervalSeconds * 1000);
}

export async function getCubeApiConfig(): Promise<CubeApiConfig> {
  if (!cubeApiConfigPromise) {
    cubeApiConfigPromise = getCubeConf().then(async (config) => {
      const baseUrl = config.CUBE_API_BASE_URL;
      const token = config.CUBE_API_TOKEN
        ? normalizeAuthorizationToken(config.CUBE_API_TOKEN)
        : await issueCubeApiToken();

      if (!baseUrl) {
        throw new Error("cube.conf에 CUBE_API_BASE_URL 값이 없습니다.");
      }

      return {
        baseUrl: normalizeBaseUrl(baseUrl),
        token,
      };
    });
  }

  return cubeApiConfigPromise;
}
