import cockpit from "cockpit";

import { getCubeApiConfig } from "./config.ts";
import { isPreviewMode } from "./preview.ts";
import { requestCubeApi } from "./client.ts";

interface SSHKeyResponse {
  code?: number;
  message?: string;
  val?: unknown;
}

export interface SSHKeyBundleDownload {
  href: string;
  buffer: ArrayBuffer | null;
  privateKey?: string;
  publicKey?: string;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

function binaryDownloadHref(base64Content: string) {
  return `data:application/octet-stream;base64,${base64Content.replace(/\s+/g, "")}`;
}

function base64ToArrayBuffer(base64Content: string): ArrayBuffer {
  const binary = window.atob(base64Content.replace(/\s+/g, ""));
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return window.btoa(binary);
}

function safeFilename(filename: string): string {
  return filename.trim().replace(/[^\w.-]/g, "_") || "ssh-key.dat";
}

export async function generateSSHKeyFiles() {
  if (isPreviewMode()) return;

  const response = await requestCubeApi<SSHKeyResponse>("/api/v1/cube/ssh/key", {
    method: "POST",
    body: {
      action: "generate",
      overwrite: true,
    },
    maxTimeSeconds: 30,
  });

  if (response.code && response.code >= 300) {
    throw new Error(response.message || "SSH KEY 생성에 실패했습니다.");
  }
}

export async function uploadSSHKeyBundle(buffer: ArrayBuffer, filename = "ssh-key.dat") {
  if (isPreviewMode()) return;

  const { baseUrl, token } = await getCubeApiConfig();
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const base64Path = `/tmp/ablestack-ssh-key-upload-${suffix}.b64`;
  const tempPath = `/tmp/ablestack-ssh-key-upload-${suffix}.dat`;

  try {
    await cockpit.file(base64Path).replace(arrayBufferToBase64(buffer));
    await cockpit.spawn(["sh", "-c", "base64 -d \"$1\" > \"$2\"", "sh", base64Path, tempPath]);
    const stdout = await cockpit.spawn([
      "curl",
      "-fSs",
      "--connect-timeout",
      "5",
      "--max-time",
      "30",
      "-X",
      "POST",
      joinUrl(baseUrl, "/api/v1/cube/ssh/key"),
      "-H",
      "accept: application/json",
      "-H",
      `Authorization: Bearer ${token}`,
      "-F",
      "action=upload",
      "-F",
      "overwrite=true",
      "-F",
      `file=@${tempPath};filename=${safeFilename(filename)}`,
    ]);
    const response = JSON.parse(stdout) as SSHKeyResponse;

    if (response.code && response.code >= 300) {
      throw new Error(response.message || "SSH KEY 등록에 실패했습니다.");
    }
  } finally {
    await cockpit.spawn(["rm", "-f", base64Path, tempPath]).catch(() => undefined);
  }
}

export async function downloadSSHKeyBundle(): Promise<SSHKeyBundleDownload> {
  if (isPreviewMode()) {
    const privateKey = "-----BEGIN RSA PRIVATE KEY-----\nPREVIEW_PRIVATE_KEY\n-----END RSA PRIVATE KEY-----";
    const publicKey = "ssh-rsa PREVIEW_PUBLIC_KEY root@ablecube";

    return {
      href: binaryDownloadHref(window.btoa(`${privateKey}\n${publicKey}`)),
      buffer: null,
      privateKey,
      publicKey,
    };
  }

  const { baseUrl, token } = await getCubeApiConfig();
  const tempPath = `/tmp/ablestack-ssh-key-${Date.now()}-${Math.random().toString(16).slice(2)}.dat`;

  try {
    await cockpit.spawn([
      "curl",
      "-fSs",
      "--connect-timeout",
      "5",
      "--max-time",
      "30",
      "-X",
      "POST",
      joinUrl(baseUrl, "/api/v1/cube/ssh/key"),
      "-H",
      "accept: application/octet-stream",
      "-H",
      `Authorization: Bearer ${token}`,
      "-H",
      "Content-Type: application/json",
      "-d",
      JSON.stringify({ action: "download" }),
      "-o",
      tempPath,
    ]);

    const base64Content = await cockpit.spawn(["base64", tempPath]);

    return {
      href: binaryDownloadHref(base64Content),
      buffer: base64ToArrayBuffer(base64Content),
    };
  } finally {
    await cockpit.spawn(["rm", "-f", tempPath]).catch(() => undefined);
  }
}
