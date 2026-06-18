import { requestCubeApi } from "./client";

export interface CloudClusterStatusData {
  clusterStatus: string;
  nodeStatus: string;
  resourceStatus: string;
  executionNode: string;
}

interface CloudClusterNode {
  host?: string;
  online?: string;
  resources_running?: string;
  standby?: string;
  maintenance?: string;
  pending?: string;
  unclean?: string;
  shutdown?: string;
  expected_up?: string;
}

interface PcsStatusResponse {
  code?: number;
  val?: {
    clustered_host?: string[];
    nodes?: CloudClusterNode[];
    started?: string;
    role?: string;
    active?: string;
    blocked?: string;
    failed?: string;
  };
  message?: string;
}

interface CloudClusterActionResponse {
  code?: number | string;
  val?: unknown;
  message?: string;
  retname?: string;
}

export const CLOUD_CLUSTER_STATUS_FALLBACK: CloudClusterStatusData = {
  clusterStatus: "N/A",
  nodeStatus: "N/A",
  resourceStatus: "N/A",
  executionNode: "N/A",
};

function isTrue(value: string | undefined): boolean {
  return value?.toLowerCase() === "true";
}

function isProblemNode(node: CloudClusterNode): boolean {
  return (
    !isTrue(node.online) ||
    isTrue(node.standby) ||
    isTrue(node.maintenance) ||
    isTrue(node.pending) ||
    isTrue(node.unclean) ||
    isTrue(node.shutdown) ||
    !isTrue(node.expected_up)
  );
}

function formatClusterStatus(val: NonNullable<PcsStatusResponse["val"]>): string {
  if (isTrue(val.failed) || isTrue(val.blocked) || !isTrue(val.active)) {
    return "HEALTH_ERR";
  }

  if (val.nodes?.some(isProblemNode)) {
    return "HEALTH_WARN";
  }

  return "HEALTH_OK";
}

function formatNodeStatus(val: NonNullable<PcsStatusResponse["val"]>): string {
  const nodes = val.clustered_host?.length
    ? val.clustered_host
    : val.nodes?.map((node) => node.host).filter((host): host is string => Boolean(host)) ?? [];

  if (nodes.length === 0) {
    return "N/A";
  }

  return `총 ${nodes.length}노드로 구성됨 : ( ${nodes.join(", ")} )`;
}

function formatResourceStatus(val: NonNullable<PcsStatusResponse["val"]>): string {
  if (isTrue(val.failed)) {
    return "실패";
  }

  if (isTrue(val.blocked)) {
    return "차단";
  }

  if (!isTrue(val.active)) {
    return "중지";
  }

  if (val.role?.toLowerCase() === "started") {
    return "실행중";
  }

  return val.role ?? "N/A";
}

function mapPcsStatus(val: NonNullable<PcsStatusResponse["val"]>): CloudClusterStatusData {
  return {
    clusterStatus: formatClusterStatus(val),
    nodeStatus: formatNodeStatus(val),
    resourceStatus: formatResourceStatus(val),
    executionNode: val.started ?? "N/A",
  };
}

export async function fetchCloudClusterStatus(): Promise<CloudClusterStatusData> {
  const parsed = await requestCubeApi<PcsStatusResponse>(
    "/api/v1/cube/pcs/control",
    {
      method: "POST",
      body: { action: "status" },
    }
  );

  if (parsed.code !== 200 || !parsed.val) {
    throw new Error(parsed.message ?? "Invalid PCS status response");
  }

  return mapPcsStatus(parsed.val);
}

function actionMessage(response: CloudClusterActionResponse, fallbackMessage: string): string {
  if (typeof response.message === "string" && response.message.trim()) {
    return response.message.trim();
  }

  if (typeof response.val === "string" && response.val.trim()) {
    return response.val.trim();
  }

  return fallbackMessage;
}

function assertActionSuccess(response: CloudClusterActionResponse, fallbackMessage: string) {
  if (String(response.code ?? "") !== "200") {
    throw new Error(actionMessage(response, fallbackMessage));
  }
}

async function runPcsControl(
  body: Record<string, unknown>,
  fallbackMessage: string,
  maxTimeSeconds = 300
): Promise<void> {
  const parsed = await requestCubeApi<CloudClusterActionResponse>(
    "/api/v1/cube/pcs/control",
    {
      method: "POST",
      maxTimeSeconds,
      body,
    }
  );

  assertActionSuccess(parsed, fallbackMessage);
}

export function startCloudCenterVm(): Promise<void> {
  return runPcsControl(
    { action: "enable", resource: "cloudcenter_res" },
    "클라우드센터VM 시작에 실패했습니다."
  );
}

export function stopCloudCenterVm(): Promise<void> {
  return runPcsControl(
    { action: "disable", resource: "cloudcenter_res" },
    "클라우드센터VM 정지에 실패했습니다."
  );
}

export function cleanupCloudCenterCluster(): Promise<void> {
  return runPcsControl(
    { action: "cleanup", resource: "cloudcenter_res" },
    "클라우드센터 클러스터 클린업에 실패했습니다."
  );
}

export function migrateCloudCenterVm(targetNode: string): Promise<void> {
  return runPcsControl(
    { action: "move", resource: "cloudcenter_res", target: targetNode },
    "클라우드센터VM 마이그레이션에 실패했습니다."
  );
}

export async function setupCloudCenterCluster(): Promise<void> {
  const parsed = await requestCubeApi<CloudClusterActionResponse>(
    "/api/v1/cube/ccvm/lifecycle",
    {
      method: "POST",
      maxTimeSeconds: 3600,
      body: {
        action: "setup",
      },
    }
  );

  assertActionSuccess(parsed, "클라우드센터 구성에 실패했습니다.");
}

export async function changeClusterSshPort(
  beforePort: number,
  afterPort: number
): Promise<void> {
  const parsed = await requestCubeApi<CloudClusterActionResponse>(
    "/api/v1/cube/security/patch",
    {
      method: "POST",
      maxTimeSeconds: 2100,
      body: {
        ssh_port: beforePort,
        new_port: afterPort,
        port_change: true,
        targets: ["all"],
        retname: "SSH Port 변경",
      },
    }
  );

  assertActionSuccess(parsed, "SSH Port 변경에 실패했습니다.");
}
