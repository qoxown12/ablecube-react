import { requestCubeApi } from "./client";

export interface ClvmDiskInfo {
  id: string;
  vgName: string;
  pvName: string;
  pvSize: string;
  wwn: string;
  diskId: string;
  label: string;
}

interface ClvmManageResponse {
  code?: number | string;
  val?: unknown;
  message?: string;
}

interface ClvmDiskValue {
  vg_name?: string;
  pv_name?: string;
  pv_size?: string;
  wwn?: string;
  disk_id?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(data: Record<string, unknown>, key: string): string {
  const value = data[key];

  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function mapClvmDisk(value: unknown, index: number): ClvmDiskInfo | null {
  if (!isRecord(value)) {
    return null;
  }

  const disk: ClvmDiskValue = {
    vg_name: readString(value, "vg_name"),
    pv_name: readString(value, "pv_name"),
    pv_size: readString(value, "pv_size"),
    wwn: readString(value, "wwn"),
    disk_id: readString(value, "disk_id"),
  };
  const vgName = disk.vg_name || `CLVM-${index + 1}`;
  const pvName = disk.pv_name || "N/A";
  const pvSize = disk.pv_size || "N/A";
  const wwn = disk.wwn || "N/A";
  const diskId = disk.disk_id || "N/A";

  return {
    id: `${vgName}:${pvName}`,
    vgName,
    pvName,
    pvSize,
    wwn,
    diskId,
    label: `${index + 1}. ${vgName} ${pvName} ${pvSize} ${wwn}`,
  };
}

function getApiErrorMessage(response: ClvmManageResponse): string {
  if (typeof response.message === "string" && response.message.trim()) {
    return response.message;
  }

  if (typeof response.val === "string" && response.val.trim()) {
    return response.val;
  }

  return "CLVM 디스크 요청에 실패했습니다.";
}

function assertClvmManageSuccess(response: ClvmManageResponse, fallbackMessage: string) {
  if (String(response.code ?? "") !== "200") {
    throw new Error(getApiErrorMessage(response) || fallbackMessage);
  }
}

export async function fetchClvmDiskList(): Promise<ClvmDiskInfo[]> {
  const parsed = await requestCubeApi<ClvmManageResponse>(
    "/api/v1/cube/clvm/manage",
    {
      method: "POST",
      body: {
        action: "list-clvm",
      },
    }
  );

  if (parsed.code !== undefined && String(parsed.code) !== "200") {
    throw new Error(getApiErrorMessage(parsed) || "CLVM 디스크 목록 조회에 실패했습니다.");
  }

  if (!Array.isArray(parsed.val)) {
    return [];
  }

  return parsed.val
    .map(mapClvmDisk)
    .filter((item): item is ClvmDiskInfo => Boolean(item));
}

export async function createClvmDisks(disks: string[]): Promise<void> {
  const parsed = await requestCubeApi<ClvmManageResponse>(
    "/api/v1/cube/clvm/manage",
    {
      method: "POST",
      maxTimeSeconds: 600,
      body: {
        action: "create-clvm",
        disks,
      },
    }
  );

  assertClvmManageSuccess(parsed, "CLVM 디스크 추가에 실패했습니다.");
}

export async function deleteClvmDisks(disks: ClvmDiskInfo[]): Promise<void> {
  const parsed = await requestCubeApi<ClvmManageResponse>(
    "/api/v1/cube/clvm/manage",
    {
      method: "POST",
      maxTimeSeconds: 600,
      body: {
        action: "delete-clvm",
        vg_names: disks.map((disk) => disk.vgName),
        pv_names: disks.map((disk) => disk.pvName),
        disks: disks
          .map((disk) => disk.diskId)
          .filter((diskId) => diskId && diskId !== "N/A"),
      },
    }
  );

  assertClvmManageSuccess(parsed, "CLVM 디스크 삭제에 실패했습니다.");
}
