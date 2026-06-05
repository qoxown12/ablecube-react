import {
  fetchGfsDiskStatus,
  type GfsDiskMountInfo,
} from "./gfs-disk-status";
import {
  fetchGfsResourceStatus,
  GFS_RESOURCE_STATUS_FALLBACK,
} from "./gfs-resource-status";

export interface GfsIntegrationStatusData {
  fenceDeviceStatus: string;
  fenceDeviceDetail: string;
  lockDeviceStatus: string;
  lockDeviceDetails: string[];
  mountDetails: GfsDiskMountInfo[];
  footerMessage: string;
  footerColor: string;
}

export const GFS_INTEGRATION_STATUS_FALLBACK: GfsIntegrationStatusData = {
  fenceDeviceStatus: GFS_RESOURCE_STATUS_FALLBACK.fenceDeviceStatus,
  fenceDeviceDetail: GFS_RESOURCE_STATUS_FALLBACK.fenceDeviceDetail,
  lockDeviceStatus: GFS_RESOURCE_STATUS_FALLBACK.lockDeviceStatus,
  lockDeviceDetails: GFS_RESOURCE_STATUS_FALLBACK.lockDeviceDetails,
  mountDetails: [],
  footerMessage: "GFS 통합이 구성되지 않았습니다.",
  footerColor: "#c9190b",
};

function hasStatus(statuses: string[], status: string): boolean {
  return statuses.some((value) => value === status);
}

export async function fetchGfsIntegrationStatus(): Promise<GfsIntegrationStatusData> {
  const [resourceStatus, diskStatus] = await Promise.all([
    fetchGfsResourceStatus(),
    fetchGfsDiskStatus(),
  ]);
  const statuses = [
    resourceStatus.fenceDeviceStatus,
    resourceStatus.lockDeviceStatus,
  ];
  const isDiskConfigured = diskStatus.mountDetails.length > 0;
  const hasError = hasStatus(statuses, "HEALTH_ERR");
  const hasWarn = hasStatus(statuses, "HEALTH_WARN");

  return {
    fenceDeviceStatus: resourceStatus.fenceDeviceStatus,
    fenceDeviceDetail: resourceStatus.fenceDeviceDetail,
    lockDeviceStatus: resourceStatus.lockDeviceStatus,
    lockDeviceDetails: resourceStatus.lockDeviceDetails,
    mountDetails: diskStatus.mountDetails,
    footerMessage: !isDiskConfigured
      ? "GFS 통합이 구성되지 않았습니다."
      : hasError
        ? "GFS 통합 구성 중 오류가 발생했습니다."
        : hasWarn
          ? "GFS 통합 상태를 확인해 주세요."
          : "GFS 통합이 구성되었습니다.",
    footerColor: !isDiskConfigured || hasError
      ? "#c9190b"
      : hasWarn
        ? "#f0ab00"
        : "#3e8635",
  };
}
