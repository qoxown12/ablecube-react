import type { GfsDiskMountInfo } from "./gfs-disk-status";
import { requestCubeApi } from "./client";

type GfsMaintenanceAction = "set" | "unset";

interface GfsManageResponse {
  code?: number | string;
  val?: unknown;
  message?: string;
}

function responseMessage(response: GfsManageResponse, fallbackMessage: string): string {
  if (typeof response.message === "string" && response.message.trim()) {
    return response.message.trim();
  }

  if (typeof response.val === "string" && response.val.trim()) {
    return response.val.trim();
  }

  return fallbackMessage;
}

function assertGfsManageSuccess(response: GfsManageResponse, fallbackMessage: string) {
  if (String(response.code ?? "") !== "200") {
    throw new Error(responseMessage(response, fallbackMessage));
  }
}

function gfsDiskPaths(disk: GfsDiskMountInfo): string[] {
  const paths = [
    ...disk.diskIds,
    ...disk.multipathList,
    ...disk.deviceList,
  ].filter((value) => value && value !== "N/A");

  return Array.from(new Set(paths));
}

function gfsDiskPayload(disk: GfsDiskMountInfo) {
  return {
    vg_name: disk.vgName,
    lv_name: disk.lvName,
    gfs_name: disk.gfsName,
    mount_point: disk.mountPath,
  };
}

export async function updateGfsFenceMaintenance(action: GfsMaintenanceAction): Promise<void> {
  const parsed = await requestCubeApi<GfsManageResponse>(
    "/api/v1/cube/gfs/manage",
    {
      method: "POST",
      maxTimeSeconds: 120,
      body: {
        action: "check-stonith",
        control: action === "set" ? "security-disable" : "security-enable",
      },
    }
  );

  assertGfsManageSuccess(parsed, "GFS 펜스 장치 유지보수 모드 변경에 실패했습니다.");
}

export async function deleteGfsDisk(disk: GfsDiskMountInfo): Promise<void> {
  const parsed = await requestCubeApi<GfsManageResponse>(
    "/api/v1/cube/gfs/manage",
    {
      method: "POST",
      maxTimeSeconds: 900,
      body: {
        action: "delete-gfs",
        ...gfsDiskPayload(disk),
        disks: gfsDiskPaths(disk),
      },
    }
  );

  assertGfsManageSuccess(parsed, "GFS 디스크 삭제에 실패했습니다.");
}

export async function extendGfsDisk(
  disk: GfsDiskMountInfo,
  isNoDowntime: boolean
): Promise<void> {
  const parsed = await requestCubeApi<GfsManageResponse>(
    "/api/v1/cube/gfs/manage",
    {
      method: "POST",
      maxTimeSeconds: 900,
      body: {
        action: "extend",
        ...gfsDiskPayload(disk),
        non_stop_check: String(isNoDowntime),
      },
    }
  );

  assertGfsManageSuccess(parsed, "GFS 디스크 확장에 실패했습니다.");
}

export async function addExtendGfsDisk(
  disk: GfsDiskMountInfo,
  addDisks: string[],
  isNoDowntime: boolean
): Promise<void> {
  const parsed = await requestCubeApi<GfsManageResponse>(
    "/api/v1/cube/gfs/manage",
    {
      method: "POST",
      maxTimeSeconds: 900,
      body: {
        action: "add-extend",
        ...gfsDiskPayload(disk),
        disks: addDisks,
        non_stop_check: String(isNoDowntime),
      },
    }
  );

  assertGfsManageSuccess(parsed, "새 LUN을 사용한 GFS 디스크 확장에 실패했습니다.");
}

export async function scanGfsStorageDevices(): Promise<void> {
  const parsed = await requestCubeApi<GfsManageResponse>(
    "/api/v1/cube/gfs/manage",
    {
      method: "POST",
      maxTimeSeconds: 300,
      body: {
        action: "scan",
      },
    }
  );

  assertGfsManageSuccess(parsed, "외부 스토리지 재검색에 실패했습니다.");
}
