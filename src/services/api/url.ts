import { requestCubeApi } from "./client";

export type CubeUrlOption = "cloudCenter" | "wallCenter" | "storageCenter";

interface CubeUrlResponse {
  code?: number | string;
  val?: unknown;
  message?: string;
  error?: string;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function apiErrorMessage(response: CubeUrlResponse, fallbackMessage: string): string {
  const error = normalizeString(response.error);
  const message = normalizeString(response.message);
  const value = normalizeString(response.val);

  return error || message || value || fallbackMessage;
}

function readUrlValue(response: CubeUrlResponse, option: CubeUrlOption): string {
  if (typeof response.val === "string") {
    return response.val.trim();
  }

  if (typeof response.val === "object" && response.val !== null) {
    const value = (response.val as Record<string, unknown>)[option];

    return normalizeString(value);
  }

  return "";
}

function validateHttpUrl(value: string, label: string): string {
  if (!value) {
    throw new Error(`${label} 연결 주소가 응답에 없습니다.`);
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${label} 연결 주소 형식이 올바르지 않습니다.`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`${label} 연결 주소 형식이 올바르지 않습니다.`);
  }

  return parsedUrl.href;
}

export async function fetchCubeUrl(option: CubeUrlOption, label: string): Promise<string> {
  const parsed = await requestCubeApi<CubeUrlResponse>(`/api/v1/cube/url?option=${option}`);

  if (parsed.code !== undefined && String(parsed.code) !== "200") {
    throw new Error(apiErrorMessage(parsed, `${label} 연결 주소 조회에 실패했습니다.`));
  }

  return validateHttpUrl(readUrlValue(parsed, option), label);
}

export const fetchStorageCenterUrl = () => fetchCubeUrl("storageCenter", "스토리지센터");
export const fetchCloudCenterUrl = () => fetchCubeUrl("cloudCenter", "클라우드센터");
export const fetchMonitoringCenterUrl = () => fetchCubeUrl("wallCenter", "모니터링센터");
