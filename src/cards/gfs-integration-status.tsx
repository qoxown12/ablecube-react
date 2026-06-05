import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Label,
  Flex,
  FlexItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
} from "@patternfly/react-core";
import {
  CubesIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EllipsisVIcon,
} from "@patternfly/react-icons";

import GfsDiskActionModal from "./gfs-disk-action-modal";
import type { GfsDiskAction } from "./gfs-disk-action-modal";
import GfsMountInfoModal from "./gfs-mount-info-modal";
import type { GfsMountInfo } from "./gfs-mount-info-modal";
import {
  STATUS_LOADING_LABEL,
  StatusLoadingIcon,
  StatusLoadingMessage,
} from "./status-loading";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import { useStatusPolling } from "../hooks/useStatusPolling";
import {
  fetchGfsIntegrationStatus,
  GFS_INTEGRATION_STATUS_FALLBACK,
} from "../services/api/gfs-integration-status";
import "./status-card.scss";

const STATUS_META = {
  HEALTH_OK: {
    label: "Health OK",
    color: "green",
    icon: <CheckCircleIcon />,
  },
  HEALTH_WARN: {
    label: "Health Warn",
    color: "orange",
    icon: <ExclamationTriangleIcon />,
  },
  HEALTH_ERR: {
    label: "Health Err",
    color: "red",
    icon: <ExclamationTriangleIcon />,
  },
};

type GfsIntegrationMaintenanceAction = "set" | "unset";
type GfsDiskImageAction = "add" | "delete";

const MAINTENANCE_ACTION_MESSAGES: Record<
GfsIntegrationMaintenanceAction,
{ title: string; message: string; confirmLabel: string }
> = {
  set: {
    title: "펜스 장치 유지보수 설정",
    message: "GFS 펜스 장치 유지보수 모드를 설정하시겠습니까?",
    confirmLabel: "설정",
  },
  unset: {
    title: "펜스 장치 유지보수 해제",
    message: "GFS 펜스 장치 유지보수 모드를 해제하시겠습니까?",
    confirmLabel: "해제",
  },
};

const DISK_IMAGE_ACTION_MESSAGES: Record<
GfsDiskImageAction,
{ title: string; message: string; confirmLabel: string }
> = {
  add: {
    title: "디스크 이미지 추가",
    message: "GFS 통합 디스크 이미지를 추가하시겠습니까?",
    confirmLabel: "추가",
  },
  delete: {
    title: "디스크 이미지 삭제",
    message: "GFS 통합 디스크 이미지를 삭제하시겠습니까?",
    confirmLabel: "삭제",
  },
};

export default function GfsIntegrationStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [gfsDiskAction, setGfsDiskAction] = React.useState<GfsDiskAction | null>(null);
  const [maintenanceAction, setMaintenanceAction] =
    React.useState<GfsIntegrationMaintenanceAction | null>(null);
  const [diskImageAction, setDiskImageAction] =
    React.useState<GfsDiskImageAction | null>(null);
  const [selectedMountInfo, setSelectedMountInfo] = React.useState<GfsMountInfo | null>(null);

  const handleStatusError = React.useCallback((error: unknown) => {
    console.error("gfs integration status API error:", error);
  }, []);
  const { data, isCollecting } = useStatusPolling({
    fetcher: fetchGfsIntegrationStatus,
    fallback: GFS_INTEGRATION_STATUS_FALLBACK,
    onError: handleStatusError,
  });

  const onSelect = () => setIsOpen(false);

  const openGfsDiskActionModal = (action: GfsDiskAction) => {
    setGfsDiskAction(action);
    setIsOpen(false);
  };

  const closeGfsDiskActionModal = () => {
    setGfsDiskAction(null);
  };

  const confirmGfsDiskAction = (action: Exclude<GfsDiskAction, "info">, selectedIds: string[]) => {
    // TODO: 백엔드 API 전환 후 GFS integration disk add/delete/extend API로 연결합니다.
    console.log("gfs integration disk action", action, selectedIds);
    setGfsDiskAction(null);
  };

  const openMaintenanceActionModal = (action: GfsIntegrationMaintenanceAction) => {
    setMaintenanceAction(action);
    setIsOpen(false);
  };

  const closeMaintenanceActionModal = () => {
    setMaintenanceAction(null);
  };

  const confirmMaintenanceAction = () => {
    // TODO: 백엔드 API 전환 후 GFS fence maintenance API로 연결합니다.
    console.log("gfs integration maintenance action", maintenanceAction);
    setMaintenanceAction(null);
  };

  const openDiskImageActionModal = (action: GfsDiskImageAction) => {
    setDiskImageAction(action);
    setIsOpen(false);
  };

  const closeDiskImageActionModal = () => {
    setDiskImageAction(null);
  };

  const confirmDiskImageAction = () => {
    // TODO: 백엔드 API 전환 후 GFS disk image add/delete API로 연결합니다.
    console.log("gfs integration disk image action", diskImageAction);
    setDiskImageAction(null);
  };

  const openMountInfoModal = (mountInfo: GfsMountInfo) => {
    setSelectedMountInfo(mountInfo);
  };

  const closeMountInfoModal = () => {
    setSelectedMountInfo(null);
  };

  const renderStatusDetail = (statusKey: string, detail?: string, detailLines?: string[]) => {
    const status =
      isCollecting
        ? {
          label: STATUS_LOADING_LABEL,
          color: "orange",
          icon: <StatusLoadingIcon />,
        }
        : (STATUS_META as any)[statusKey] ?? {
          label: statusKey || "N/A",
          color: "orange",
          icon: <InfoCircleIcon />,
        };

    return (
      <Flex className="ct-status-card__detail" gap={{ default: "gapSm" }}>
        <Label
          className="ct-health-label"
          color={status.color}
          icon={status.icon}
        >
          {status.label}
        </Label>
        {detailLines && detailLines.length > 0 ? (
          <Flex direction={{ default: "column" }} className="ct-status-card__detail-text">
            {detailLines.map((line, index) => (
              <FlexItem key={`${line}-${index}`}>{line}</FlexItem>
            ))}
          </Flex>
        ) : (
          <span className="ct-status-card__detail-text">{detail}</span>
        )}
      </Flex>
    );
  };

  const maintenanceActionMessage = maintenanceAction
    ? MAINTENANCE_ACTION_MESSAGES[maintenanceAction]
    : null;
  const diskImageActionMessage = diskImageAction
    ? DISK_IMAGE_ACTION_MESSAGES[diskImageAction]
    : null;

  return (
    <Card className="ct-status-card">
      <CardHeader
        className="ct-status-card__header"
        actions={{
          actions: (
            <Dropdown
              isOpen={isOpen}
              onSelect={onSelect}
              onOpenChange={setIsOpen}
              popperProps={{ placement: "bottom-end", preventOverflow: true }}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  variant="plain"
                  aria-label="카드 메뉴"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <EllipsisVIcon />
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem onClick={() => openMaintenanceActionModal("set")}>
                  펜스 장치 유지보수 설정
                </DropdownItem>
                <DropdownItem onClick={() => openMaintenanceActionModal("unset")}>
                  펜스 장치 유지보수 해제
                </DropdownItem>
                <DropdownItem onClick={() => openGfsDiskActionModal("add")}>
                  GFS 디스크 추가
                </DropdownItem>
                <DropdownItem onClick={() => openGfsDiskActionModal("delete")}>
                  GFS 디스크 삭제
                </DropdownItem>
                <DropdownItem onClick={() => openGfsDiskActionModal("extend")}>
                  GFS 디스크 확장
                </DropdownItem>
                <DropdownItem onClick={() => openDiskImageActionModal("add")}>
                  디스크 이미지 추가
                </DropdownItem>
                <DropdownItem onClick={() => openDiskImageActionModal("delete")}>
                  디스크 이미지 삭제
                </DropdownItem>
                <DropdownItem onClick={() => openGfsDiskActionModal("info")}>
                  디스크 상세 정보
                </DropdownItem>
              </DropdownList>
            </Dropdown>
          ),
        }}
      >
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <FlexItem>
            <CardTitle>
              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                <CubesIcon
                  style={{ fontSize: "var(--pf-global--icon--FontSize--lg)" }}
                  aria-hidden="true"
                />
                <span>GFS 통합 상태</span>
              </Flex>
            </CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody>
        <DescriptionList isCompact className="ct-status-card__dl">
          <DescriptionListGroup>
            <DescriptionListTerm>펜스 장치 상태</DescriptionListTerm>
            <DescriptionListDescription>
              {renderStatusDetail(data.fenceDeviceStatus, data.fenceDeviceDetail)}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>잠금 장치 상태</DescriptionListTerm>
            <DescriptionListDescription>
              {renderStatusDetail(data.lockDeviceStatus, undefined, data.lockDeviceDetails)}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>마운트 경로</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                {data.mountDetails.length > 0 ? data.mountDetails.map((mountInfo, index) => (
                  <FlexItem key={`${mountInfo.mountPath}-${index}`}>
                    <button
                      type="button"
                      className="ct-status-card__mount ct-status-card__mount-button"
                      onClick={() => openMountInfoModal(mountInfo)}
                    >
                      {mountInfo.mountPath}
                    </button>
                  </FlexItem>
                )) : (
                  <FlexItem>N/A</FlexItem>
                )}
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>

      <CardFooter
        className="ct-status-card__footer"
        style={{ color: isCollecting ? "#f0ab00" : data.footerColor }}
      >
        {isCollecting ? (
          <StatusLoadingMessage>GFS 통합 상태 체크 중...</StatusLoadingMessage>
        ) : data.footerMessage}
      </CardFooter>

      <GfsDiskActionModal
        action={gfsDiskAction}
        isOpen={gfsDiskAction !== null}
        onClose={closeGfsDiskActionModal}
        onConfirm={confirmGfsDiskAction}
      />

      <GfsMountInfoModal
        isOpen={selectedMountInfo !== null}
        mountInfo={selectedMountInfo}
        onClose={closeMountInfoModal}
      />

      {maintenanceActionMessage && (
        <ConfirmActionModal
          isOpen={maintenanceAction !== null}
          title={maintenanceActionMessage.title}
          message={maintenanceActionMessage.message}
          confirmLabel={maintenanceActionMessage.confirmLabel}
          onClose={closeMaintenanceActionModal}
          onConfirm={confirmMaintenanceAction}
        />
      )}

      {diskImageActionMessage && (
        <ConfirmActionModal
          isOpen={diskImageAction !== null}
          title={diskImageActionMessage.title}
          message={diskImageActionMessage.message}
          confirmLabel={diskImageActionMessage.confirmLabel}
          onClose={closeDiskImageActionModal}
          onConfirm={confirmDiskImageAction}
        />
      )}
    </Card>
  );
}
