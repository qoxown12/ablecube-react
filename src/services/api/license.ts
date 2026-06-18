import { requestCubeApi } from "./client";

type RegisteredLicenseKind = "active" | "inactive";

interface LicenseApiResponse {
  code?: unknown;
  val?: unknown;
}

interface LicenseApiStatusValue {
  status?: unknown;
  expired?: unknown;
  issued?: unknown;
  oem?: unknown;
  file_path?: unknown;
}

export type LicenseStatusResult =
  | {
      kind: "active" | "inactive";
      issued: string;
      expired: string;
      oem?: string;
      filePath?: string;
    }
  | {
      kind: "missing" | "error";
      message: string;
    };

function responseCode(response: LicenseApiResponse): string {
  return String(response.code ?? "");
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function responseMessage(response: LicenseApiResponse): string {
  if (typeof response.val === "string" && response.val.trim()) {
    return response.val.trim();
  }

  if (isRecord(response)) {
    const message = stringValue(response.message);

    if (message) {
      return message;
    }
  }

  return "알 수 없는 오류";
}

function normalizeLicenseKind(value: unknown): RegisteredLicenseKind | "" {
  const status = stringValue(value).toLowerCase();

  if (status === "active" || status === "inactive") {
    return status;
  }

  return "";
}

function parseLicenseStatusValue(value: unknown): LicenseStatusResult {
  if (!isRecord(value)) {
    return {
      kind: "error",
      message: "라이센스 상태 응답 형식이 올바르지 않습니다.",
    };
  }

  const statusValue = value as LicenseApiStatusValue;
  const kind = normalizeLicenseKind(statusValue.status);
  const issued = stringValue(statusValue.issued);
  const expired = stringValue(statusValue.expired);

  if (!kind) {
    return {
      kind: "error",
      message: "라이센스 상태 값이 올바르지 않습니다.",
    };
  }

  if (!issued || !expired) {
    return {
      kind: "error",
      message: "라이센스 시작일 또는 만료일 값이 없습니다.",
    };
  }

  const oem = stringValue(statusValue.oem);
  const filePath = stringValue(statusValue.file_path);

  return {
    kind,
    issued,
    expired,
    ...(oem ? { oem } : {}),
    ...(filePath ? { filePath } : {}),
  };
}

export async function fetchLicenseStatus(): Promise<LicenseStatusResult> {
  const response = await requestCubeApi<LicenseApiResponse>("/api/v1/cube/license", {
    method: "POST",
    body: { action: "status" },
  });
  const code = responseCode(response);

  if (code === "200") {
    return parseLicenseStatusValue(response.val);
  }

  if (code === "404") {
    return {
      kind: "missing",
      message: responseMessage(response),
    };
  }

  return {
    kind: "error",
    message: responseMessage(response),
  };
}

export async function registerLicenseContent(
  licenseContent: string,
  originalFilename: string
): Promise<string> {
  const response = await requestCubeApi<LicenseApiResponse>("/api/v1/cube/license", {
    method: "POST",
    body: {
      action: "register",
      license_content: licenseContent,
      original_filename: originalFilename,
    },
  });

  if (responseCode(response) === "200") {
    return responseMessage(response);
  }

  throw new Error(responseMessage(response));
}
