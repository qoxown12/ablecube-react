import { requestCubeApi } from "./client";

export interface DiskSelectionItem {
  id: string;
  value: string;
  label: string;
  path: string;
  name: string;
  size: string;
  state: string;
  type: string;
  disabled: boolean;
  partitionCount: number;
  diskId: string;
  rbdPath: string;
}

interface DiskDevice {
  name?: string;
  kname?: string;
  path?: string | null;
  id?: string | null;
  rbd_path?: string | null;
  state?: string | null;
  size?: string | null;
  type?: string | null;
  tran?: string | null;
  group?: string | null;
  subsystems?: string | null;
  vendor?: string | null;
  model?: string | null;
  wwn?: string | null;
  single_path?: DiskDevice[];
  children?: DiskDevice[];
}

interface DiskResponse {
  blockdevices?: DiskDevice[];
}

function normalizeString(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function devicePath(device: DiskDevice): string {
  return normalizeString(device.path) || (device.name ? `/dev/${device.name}` : "N/A");
}

function deviceType(device: DiskDevice): string {
  return normalizeString(device.type) || normalizeString(device.tran) || "N/A";
}

function deviceValue(device: DiskDevice): string {
  return (
    normalizeString(device.id) ||
    normalizeString(device.rbd_path) ||
    normalizeString(device.path) ||
    (device.name ? `/dev/${device.name}` : "")
  );
}

function partitionText(count: number): string {
  return count > 0 ? `( Partition exists count : ${count} )` : "";
}

function deviceIdentity(device: DiskDevice, parent: DiskDevice | null): string {
  return (
    normalizeString(parent?.wwn) ||
    normalizeString(device.wwn) ||
    normalizeString(device.id) ||
    normalizeString(parent?.id)
  );
}

function isRbdDevice(device: DiskDevice): boolean {
  const name = normalizeString(device.name).toLowerCase();
  const path = devicePath(device).toLowerCase();
  const subsystems = normalizeString(device.subsystems).toLowerCase();

  return (
    name.startsWith("rbd") ||
    path.startsWith("/dev/rbd") ||
    subsystems.split(":").includes("rbd") ||
    Boolean(normalizeString(device.rbd_path))
  );
}

function isPartitionLikeDevice(device: DiskDevice): boolean {
  const type = deviceType(device).toLowerCase();

  return type === "part" || type === "lvm";
}

function isMultipathDevice(device: DiskDevice): boolean {
  const type = deviceType(device).toLowerCase();
  const name = normalizeString(device.name).toLowerCase();
  const path = devicePath(device).toLowerCase();

  if (type === "mpath") {
    return true;
  }

  if (isPartitionLikeDevice(device)) {
    return false;
  }

  return name.startsWith("mpath") || path.startsWith("/dev/mapper/mpath");
}

function makeSelectionItem(
  device: DiskDevice,
  parent: DiskDevice | null,
  disabled: boolean
): DiskSelectionItem | null {
  const value = deviceValue(device);
  const path = devicePath(device);
  const partitionCount = device.children?.length ?? 0;

  if (!value && path === "N/A") {
    return null;
  }

  const vendor = normalizeString(parent?.vendor) || normalizeString(device.vendor);
  const model = normalizeString(parent?.model) || normalizeString(device.model);
  const identity = deviceIdentity(device, parent);
  const details = [
    path,
    normalizeString(device.state),
    `(${deviceType(device)})`,
    normalizeString(device.size),
    vendor,
    model,
    identity,
    partitionText(partitionCount),
  ].filter(Boolean);

  return {
    id: value || path,
    value: value || path,
    label: details.join(" "),
    path,
    name: normalizeString(device.name) || path,
    size: normalizeString(device.size) || "N/A",
    state: normalizeString(device.state) || "N/A",
    type: deviceType(device),
    disabled,
    partitionCount,
    diskId: normalizeString(device.id),
    rbdPath: normalizeString(device.rbd_path),
  };
}

function pushUnique(items: DiskSelectionItem[], nextItem: DiskSelectionItem | null) {
  if (!nextItem) {
    return;
  }

  if (items.some((item) => item.id === nextItem.id)) {
    return;
  }

  items.push(nextItem);
}

function mapGfsDiskCandidates(blockdevices: DiskDevice[]): DiskSelectionItem[] {
  const items: DiskSelectionItem[] = [];

  for (const device of blockdevices) {
    if (isRbdDevice(device)) {
      continue;
    }

    if (isPartitionLikeDevice(device)) {
      continue;
    }

    const children = (device.children ?? []).filter((child) => !isRbdDevice(child));

    if (isMultipathDevice(device)) {
      pushUnique(items, makeSelectionItem({ ...device, children }, null, children.length > 0));
      continue;
    }

    const multipathChildren = children.filter(isMultipathDevice);

    if (multipathChildren.length > 0) {
      for (const child of multipathChildren) {
        const childChildren = (child.children ?? []).filter((grandChild) => !isRbdDevice(grandChild));

        pushUnique(
          items,
          makeSelectionItem(
            { ...child, children: childChildren },
            device,
            childChildren.length > 0
          )
        );
      }
      continue;
    }

    pushUnique(items, makeSelectionItem({ ...device, children }, null, children.length > 0));
  }

  return items;
}

function mapRbdDiskCandidates(blockdevices: DiskDevice[]): DiskSelectionItem[] {
  return blockdevices
    .map((device) => makeSelectionItem(device, null, (device.children?.length ?? 0) > 0))
    .filter((item): item is DiskSelectionItem => Boolean(item));
}

async function fetchDisk(action: "gfs" | "rbd"): Promise<DiskResponse> {
  return requestCubeApi<DiskResponse>(`/api/v1/cube/disk?action=${action}`);
}

export async function fetchGfsDiskCandidates(): Promise<DiskSelectionItem[]> {
  const parsed = await fetchDisk("gfs");

  return mapGfsDiskCandidates(parsed.blockdevices ?? []);
}

export async function fetchRbdDiskCandidates(): Promise<DiskSelectionItem[]> {
  const parsed = await fetchDisk("rbd");

  return mapRbdDiskCandidates(parsed.blockdevices ?? []);
}
