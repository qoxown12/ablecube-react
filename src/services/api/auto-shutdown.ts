import { requestCubeApi } from "./client";

type AutoShutdownAction = "check_mount" | "stop_scvms" | "shutdown_hosts";

interface AutoShutdownResponse {
  code?: number | string;
  val?: unknown;
  message?: string;
  retname?: string;
}

function responseMessage(response: AutoShutdownResponse, fallbackMessage: string): string {
  if (typeof response.message === "string" && response.message.trim()) {
    return response.message.trim();
  }

  if (typeof response.val === "string" && response.val.trim()) {
    return response.val.trim();
  }

  return fallbackMessage;
}

async function runAutoShutdownAction(action: AutoShutdownAction): Promise<void> {
  const parsed = await requestCubeApi<AutoShutdownResponse>(
    "/api/v1/cube/auto-shutdown",
    {
      method: "POST",
      maxTimeSeconds: 300,
      body: { action },
    }
  );

  if (String(parsed.code ?? "") !== "200") {
    throw new Error(responseMessage(parsed, "전체 시스템 자동 종료 절차에 실패했습니다."));
  }
}

export async function runAutoShutdownSequence(): Promise<void> {
  await runAutoShutdownAction("check_mount");
  await runAutoShutdownAction("stop_scvms");
  await runAutoShutdownAction("shutdown_hosts");
}
