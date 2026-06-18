import { requestCubeApi } from "./client";

interface RbdManageResponse {
  code?: number | string;
  val?: unknown;
  message?: string;
  retname?: string;
}

function responseMessage(response: RbdManageResponse, fallbackMessage: string): string {
  if (typeof response.message === "string" && response.message.trim()) {
    return response.message.trim();
  }

  if (typeof response.val === "string" && response.val.trim()) {
    return response.val.trim();
  }

  return fallbackMessage;
}

function assertRbdManageSuccess(response: RbdManageResponse, fallbackMessage: string) {
  if (String(response.code ?? "") !== "200") {
    throw new Error(responseMessage(response, fallbackMessage));
  }
}

export async function createRbdImages(sizeGiB: number): Promise<void> {
  const parsed = await requestCubeApi<RbdManageResponse>(
    "/api/v1/cube/rbd/manage",
    {
      method: "POST",
      maxTimeSeconds: 2100,
      body: {
        action: "create",
        size: sizeGiB,
        pool_name: "rbd",
        image_prefix: "gfs",
      },
    }
  );

  assertRbdManageSuccess(parsed, "디스크 이미지 추가에 실패했습니다.");
}

export async function deleteRbdImages(images: string[]): Promise<void> {
  const parsed = await requestCubeApi<RbdManageResponse>(
    "/api/v1/cube/rbd/manage",
    {
      method: "POST",
      maxTimeSeconds: 2100,
      body: {
        action: "delete",
        images,
        pool_name: "rbd",
      },
    }
  );

  assertRbdManageSuccess(parsed, "디스크 이미지 삭제에 실패했습니다.");
}
