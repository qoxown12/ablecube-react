import { requestCubeApi } from "./client";

export interface LocalDiskStatusData {
  status: string;
  mountPath: string;
  physicalVolume: string;
  volumeGroup: string;
  diskSize: string;
  footerMessage: string;
  footerColor: string;
}

interface LocalDiskStatusValue {
  status?: string;
  mount_path?: string;
  pv?: string;
  vg?: string;
  size?: string;
}

interface LocalManageResponse {
  code?: number | string;
  val?: unknown;
  message?: string;
  action?: string;
}

export const LOCAL_DISK_STATUS_FALLBACK: LocalDiskStatusData = {
  status: "Health Err",
  mountPath: "N/A",
  physicalVolume: "N/A",
  volumeGroup: "N/A",
  diskSize: "N/A",
  footerMessage: "로컬 디스크가 생성되지 않았습니다.",
  footerColor: "#c9190b",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(data: Record<string, unknown>, key: string): string {
  const value = data[key];

  return typeof value === "string" && value.trim() ? value.trim() : "N/A";
}

function isSuccessCode(code: number | string | undefined): boolean {
  return Number(code) === 200;
}

function formatSize(size: string | undefined): string {
  const normalizedSize = size?.trim();

  if (!normalizedSize) {
    return LOCAL_DISK_STATUS_FALLBACK.diskSize;
  }

  if (/^\d+(?:\.\d+)?\s*[kmgtpe]$/i.test(normalizedSize)) {
    return `${normalizedSize}B`;
  }

  return normalizedSize;
}

function mapLocalDiskStatus(
  response: LocalManageResponse,
  value: LocalDiskStatusValue
): LocalDiskStatusData {
  const isHealthy = isSuccessCode(response.code) && value.status === "Health OK";

  return {
    status: value.status ?? LOCAL_DISK_STATUS_FALLBACK.status,
    mountPath: value.mount_path ?? LOCAL_DISK_STATUS_FALLBACK.mountPath,
    physicalVolume: value.pv ?? LOCAL_DISK_STATUS_FALLBACK.physicalVolume,
    volumeGroup: value.vg ?? LOCAL_DISK_STATUS_FALLBACK.volumeGroup,
    diskSize: formatSize(value.size),
    footerMessage: isHealthy
      ? "로컬 디스크가 생성되었습니다."
      : "로컬 디스크가 생성되지 않았습니다.",
    footerColor: isHealthy ? "#3e8635" : "#c9190b",
  };
}

export async function fetchLocalDiskStatus(): Promise<LocalDiskStatusData> {
  const parsed = await requestCubeApi<LocalManageResponse>(
    "/api/v1/cube/local/manage",
    {
      method: "POST",
      body: {
        action: "local-disk-status",
      },
    }
  );

  if (!isRecord(parsed.val)) {
    return LOCAL_DISK_STATUS_FALLBACK;
  }

  return mapLocalDiskStatus(parsed, {
    status: readString(parsed.val, "status"),
    mount_path: readString(parsed.val, "mount_path"),
    pv: readString(parsed.val, "pv"),
    vg: readString(parsed.val, "vg"),
    size: readString(parsed.val, "size"),
  });
}
