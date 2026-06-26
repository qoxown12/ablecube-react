import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Dropdown,
  DropdownGroup,
  DropdownList,
  DropdownItem,
  MenuToggle,
} from "@patternfly/react-core";

import ClvmDiskActionModal from "./clvm-disk-action-modal";
import type { ClvmDiskAction } from "./clvm-disk-action-modal";
import GfsDiskActionModal from "./gfs-disk-action-modal";
import type { GfsDiskAction } from "./gfs-disk-action-modal";
import GfsMountInfoModal from "./gfs-mount-info-modal";
import type { GfsMountInfo } from "./gfs-mount-info-modal";
import { StatusLoadingMessage } from "./status-loading";
import { useStatusPolling } from "../hooks/useStatusPolling";
import {
  fetchGfsDiskStatus,
  GFS_DISK_STATUS_FALLBACK,
} from "../services/api/gfs-disk-status";
import {
  InfoGrid,
  InfoItem,
  parseUsagePercent,
  StatusCardHeading,
} from "./status-card-layout";
import "./status-card.scss";

function isKnownValue(value: string | undefined): value is string {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  return normalizedValue !== "" && normalizedValue !== "N/A";
}

function mountCapacityLabel(mountInfo: GfsMountInfo): string {
  const total = isKnownValue(mountInfo.totalCapacity) ? mountInfo.totalCapacity : mountInfo.diskSize;
  const used = isKnownValue(mountInfo.usedCapacity) ? mountInfo.usedCapacity : "N/A";
  const available = isKnownValue(mountInfo.availableCapacity) ? mountInfo.availableCapacity : "N/A";
  const usagePercentage = isKnownValue(mountInfo.usagePercentage) ? mountInfo.usagePercentage : "N/A";
  const details = [
    isKnownValue(used) ? `${used} 사용` : "",
    isKnownValue(available) ? `${available} 가능` : "",
    isKnownValue(total) ? `전체 ${total}` : "",
  ].filter(Boolean);

  if (details.length > 0 && isKnownValue(usagePercentage)) {
    return `${details.join(" / ")} (${usagePercentage})`;
  }

  if (details.length > 0) {
    return details.join(" / ");
  }

  return "N/A";
}

export default function GfsDiskStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [gfsDiskAction, setGfsDiskAction] = React.useState<GfsDiskAction | null>(null);
  const [clvmDiskAction, setClvmDiskAction] = React.useState<ClvmDiskAction | null>(null);
  const [selectedMountInfo, setSelectedMountInfo] = React.useState<GfsMountInfo | null>(null);

  const handleStatusError = React.useCallback((error: unknown) => {
    console.error("gfs disk status API error:", error);
  }, []);
  const { data, isCollecting } = useStatusPolling({
    fetcher: fetchGfsDiskStatus,
    fallback: GFS_DISK_STATUS_FALLBACK,
    onError: handleStatusError,
  });

  const onSelect = () => setIsOpen(false);

  const mountDetails = data.mountDetails.length > 0
    ? data.mountDetails
    : data.mountPath
      ? [{
        mountPath: data.mountPath,
        status: "N/A",
        devices: "N/A",
        multipaths: "N/A",
        physicalVolume: "N/A",
        volumeGroup: "N/A",
        diskSize: "N/A",
        totalCapacity: "N/A",
        usedCapacity: "N/A",
        availableCapacity: "N/A",
        usagePercentage: "N/A",
        resourceStatus: ["N/A"],
      }]
      : [];

  const openGfsDiskActionModal = (action: GfsDiskAction) => {
    setGfsDiskAction(action);
    setIsOpen(false);
  };

  const closeGfsDiskActionModal = () => {
    setGfsDiskAction(null);
  };

  const confirmGfsDiskAction = (action: Exclude<GfsDiskAction, "info">, selectedIds: string[]) => {
    // TODO: 백엔드 API 전환 후 GFS disk add/delete/extend API로 연결합니다.
    console.log("gfs disk action", action, selectedIds);
    setGfsDiskAction(null);
  };

  const openClvmDiskActionModal = (action: ClvmDiskAction) => {
    setClvmDiskAction(action);
    setIsOpen(false);
  };

  const closeClvmDiskActionModal = () => {
    setClvmDiskAction(null);
  };

  const confirmClvmDiskAction = (action: Exclude<ClvmDiskAction, "info">, selectedIds: string[]) => {
    // TODO: 백엔드 API 전환 후 CLVM disk add/delete API로 연결합니다.
    console.log("gfs clvm disk action", action, selectedIds);
    setClvmDiskAction(null);
  };

  const openMountInfoModal = (mountInfo: GfsMountInfo) => {
    setSelectedMountInfo(mountInfo);
  };

  const closeMountInfoModal = () => {
    setSelectedMountInfo(null);
  };

  return (
    <Card className="ct-status-card">
      <CardHeader
        className="ct-status-card__header"
        actions={{
          actions: (
            <Dropdown
              className="ct-status-card__dropdown"
              isOpen={isOpen}
              onSelect={onSelect}
              onOpenChange={setIsOpen}
              popperProps={{ placement: "bottom-end", preventOverflow: true }}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  variant="plain"
                  aria-expanded={isOpen}
                  aria-label={isOpen ? "카드 메뉴 닫기" : "카드 메뉴 열기"}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span
                    className={`ct-status-card__menu-arrow${isOpen ? " ct-status-card__menu-arrow--open" : ""}`}
                    aria-hidden="true"
                  />
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownGroup label="GFS 디스크" className="ct-status-card__menu-group">
                  <DropdownItem onClick={() => openGfsDiskActionModal("add")}>
                    GFS 디스크 추가
                  </DropdownItem>
                  <DropdownItem onClick={() => openGfsDiskActionModal("delete")}>
                    GFS 디스크 삭제
                  </DropdownItem>
                  <DropdownItem onClick={() => openGfsDiskActionModal("extend")}>
                    GFS 디스크 확장
                  </DropdownItem>
                </DropdownGroup>
                <DropdownGroup label="CLVM 디스크" className="ct-status-card__menu-group">
                  <DropdownItem onClick={() => openClvmDiskActionModal("add")}>
                    CLVM 디스크 추가
                  </DropdownItem>
                  <DropdownItem onClick={() => openClvmDiskActionModal("delete")}>
                    CLVM 디스크 삭제
                  </DropdownItem>
                  <DropdownItem onClick={() => openClvmDiskActionModal("info")}>
                    CLVM 디스크 정보
                  </DropdownItem>
                </DropdownGroup>
                <DropdownGroup label="상세 정보" className="ct-status-card__menu-group">
                  <DropdownItem onClick={() => openGfsDiskActionModal("info")}>
                    디스크 상세 정보
                  </DropdownItem>
                </DropdownGroup>
              </DropdownList>
            </Dropdown>
          ),
        }}
      >
        <CardTitle>
          <StatusCardHeading
            icon={<span className="ct-status-card__emoji" aria-hidden="true">💽</span>}
            title="GFS 디스크 상태"
            subtitle="Global File System"
            tone="disk"
          />
        </CardTitle>
      </CardHeader>

      <CardBody>
        <InfoGrid>
          <InfoItem label="모드">
            {data.mode}
          </InfoItem>
          <InfoItem label="마운트 수">
            {mountDetails.length > 0 ? `${mountDetails.length}개` : "N/A"}
          </InfoItem>
          <InfoItem label="마운트별 용량" full>
            <div className="ct-status-card__mount-capacity-list">
              {mountDetails.length > 0 ? mountDetails.map((mountInfo, index) => (
                <div
                  className="ct-status-card__mount-capacity"
                  key={`${mountInfo.mountPath}-${index}`}
                >
                  <div className="ct-status-card__mount-capacity-head">
                    <button
                      type="button"
                      className="ct-status-card__mount ct-status-card__mount-button"
                      onClick={() => openMountInfoModal(mountInfo)}
                    >
                      {mountInfo.mountPath}
                    </button>
                    <span className="ct-status-card__mount-capacity-meta">
                      {mountCapacityLabel(mountInfo)}
                    </span>
                  </div>
                  <div className="ct-status-card__capacity-bar ct-status-card__mount-capacity-bar">
                    <div
                      className="ct-status-card__capacity-fill"
                      style={{ inlineSize: `${parseUsagePercent(mountInfo.usagePercentage ?? "") ?? 0}%` }}
                    />
                  </div>
                </div>
              )) : (
                <span>N/A</span>
              )}
            </div>
          </InfoItem>
        </InfoGrid>
      </CardBody>

      <CardFooter
        className="ct-status-card__footer"
        style={{ color: isCollecting ? "#f0ab00" : data.footerColor }}
      >
        {isCollecting ? (
          <StatusLoadingMessage>GFS 디스크 상태를 확인하고 있습니다.</StatusLoadingMessage>
        ) : data.footerMessage}
      </CardFooter>

      <GfsDiskActionModal
        action={gfsDiskAction}
        isOpen={gfsDiskAction !== null}
        onClose={closeGfsDiskActionModal}
        onConfirm={confirmGfsDiskAction}
      />

      <ClvmDiskActionModal
        action={clvmDiskAction}
        isOpen={clvmDiskAction !== null}
        onClose={closeClvmDiskActionModal}
        onConfirm={confirmClvmDiskAction}
      />

      <GfsMountInfoModal
        isOpen={selectedMountInfo !== null}
        mountInfo={selectedMountInfo}
        onClose={closeMountInfoModal}
      />
    </Card>
  );
}
