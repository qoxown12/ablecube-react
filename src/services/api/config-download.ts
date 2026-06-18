import cockpit from "cockpit";

import { getCubeApiConfig } from "./config";

export interface DownloadAsset {
  filename: string;
  href: string;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function textDownloadHref(content: string): string {
  return `data:application/json;charset=utf-8,${encodeURIComponent(content)}`;
}

async function requestCubeApiJsonStrict<T>(path: string): Promise<T> {
  const { baseUrl, token } = await getCubeApiConfig();
  const stdout = await cockpit.spawn([
    "curl",
    "-f",
    "-sS",
    "--connect-timeout",
    "5",
    "--max-time",
    "15",
    "-X",
    "GET",
    joinUrl(baseUrl, path),
    "-H",
    "accept: application/json",
    "-H",
    `Authorization: Bearer ${token}`,
  ]);

  return JSON.parse(stdout) as T;
}

export async function fetchSshKeyBundleDownload(): Promise<DownloadAsset> {
  const { baseUrl, token } = await getCubeApiConfig();
  const url = joinUrl(baseUrl, "/api/v1/cube/ssh/key");
  const body = JSON.stringify({ action: "download" });
  const command = [
    "set -o pipefail;",
    "curl",
    "-f",
    "-sS",
    "--connect-timeout",
    "5",
    "--max-time",
    "30",
    "-X",
    "POST",
    shellQuote(url),
    "-H",
    shellQuote("accept: application/octet-stream"),
    "-H",
    shellQuote(`Authorization: Bearer ${token}`),
    "-H",
    shellQuote("Content-Type: application/json"),
    "-d",
    shellQuote(body),
    "|",
    "base64",
    "-w",
    "0",
  ].join(" ");

  const base64Content = (await cockpit.spawn(["bash", "-lc", command])).replace(/\s+/g, "");

  if (!base64Content) {
    throw new Error("SSH Key 다운로드 API 응답이 비어 있습니다.");
  }

  return {
    filename: "ablestack-ssh-key.dat",
    href: `data:application/octet-stream;base64,${base64Content}`,
  };
}

export async function fetchClusterJsonDownload(): Promise<DownloadAsset> {
  const [clusterConfig, systemProfile] = await Promise.all([
    requestCubeApiJsonStrict<unknown>("/api/v1/cube/cluster/config"),
    requestCubeApiJsonStrict<unknown>("/api/v1/cube/system/config"),
  ]);
  const content = JSON.stringify({ clusterConfig, systemProfile }, null, 2);

  return {
    filename: "cluster.json",
    href: textDownloadHref(content),
  };
}
