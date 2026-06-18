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

import {
  STATUS_LOADING_LABEL,
  StatusLoadingIcon,
  StatusLoadingMessage,
} from "./status-loading";
import WwnListModal from "./wwn-list-modal";
import ActionProgressModal from "../components/common/ActionProgressModal";
import type { ActionProgressPhase } from "../components/common/ActionProgressModal";
import CheckedConfirmActionModal from "../components/common/CheckedConfirmActionModal";
import SelectActionModal from "../components/common/SelectActionModal";
import { useStatusPolling } from "../hooks/useStatusPolling";
import { scanGfsStorageDevices } from "../services/api/gfs-manage";
import {
  fetchGfsResourceStatus,
  GFS_RESOURCE_STATUS_FALLBACK,
} from "../services/api/gfs-resource-status";
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

export default function GfsResourceStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isExternalStorageSyncModalOpen, setIsExternalStorageSyncModalOpen] = React.useState(false);
  const [isExternalStorageRescanModalOpen, setIsExternalStorageRescanModalOpen] = React.useState(false);
  const [isWwnListModalOpen, setIsWwnListModalOpen] = React.useState(false);
  const [isHostRemoveModalOpen, setIsHostRemoveModalOpen] = React.useState(false);
  const [actionProgress, setActionProgress] = React.useState<{
    isOpen: boolean;
    phase: ActionProgressPhase;
    title: string;
    message: string;
  }>({
    isOpen: false,
    phase: "running",
    title: "",
    message: "",
  });

  const handleStatusError = React.useCallback((error: unknown) => {
    console.error("gfs resource status API error:", error);
  }, []);
  const { data, isCollecting } = useStatusPolling({
    fetcher: fetchGfsResourceStatus,
    fallback: GFS_RESOURCE_STATUS_FALLBACK,
    onError: handleStatusError,
  });

  const onSelect = () => setIsOpen(false);

  const openExternalStorageSyncModal = () => {
    setIsExternalStorageSyncModalOpen(true);
    setIsOpen(false);
  };

  const closeExternalStorageSyncModal = () => {
    setIsExternalStorageSyncModalOpen(false);
  };

  const confirmExternalStorageSync = () => {
    setIsExternalStorageSyncModalOpen(false);
    setActionProgress({
      isOpen: true,
      phase: "error",
      title: "외부 스토리지 동기화",
      message: "multipath 설정 동기화까지 수행하는 API가 아직 확인되지 않았습니다. 현재 연결 가능한 API는 외부 스토리지 재검색입니다.",
    });
  };

  const openExternalStorageRescanModal = () => {
    setIsExternalStorageRescanModalOpen(true);
    setIsOpen(false);
  };

  const closeExternalStorageRescanModal = () => {
    setIsExternalStorageRescanModalOpen(false);
  };

  const confirmExternalStorageRescan = async () => {
    setIsExternalStorageRescanModalOpen(false);
    setActionProgress({
      isOpen: true,
      phase: "running",
      title: "외부 스토리지 재검색",
      message: "외부 스토리지 재검색을 진행중입니다.",
    });

    try {
      await scanGfsStorageDevices();
      setActionProgress({
        isOpen: true,
        phase: "success",
        title: "외부 스토리지 재검색",
        message: "외부 스토리지 재검색이 완료되었습니다.",
      });
    } catch (error) {
      console.error("gfs external storage rescan API error:", error);
      setActionProgress({
        isOpen: true,
        phase: "error",
        title: "외부 스토리지 재검색",
        message: error instanceof Error
          ? error.message
          : "외부 스토리지 재검색에 실패했습니다.",
      });
    }
  };

  const openWwnListModal = () => {
    setIsWwnListModalOpen(true);
    setIsOpen(false);
  };

  const closeWwnListModal = () => {
    setIsWwnListModalOpen(false);
  };

  const openHostRemoveModal = () => {
    setIsHostRemoveModalOpen(true);
    setIsOpen(false);
  };

  const closeHostRemoveModal = () => {
    setIsHostRemoveModalOpen(false);
  };

  const confirmHostRemove = (hostname: string) => {
    setIsHostRemoveModalOpen(false);
    setActionProgress({
      isOpen: true,
      phase: "error",
      title: "호스트 제거",
      message: `${hostname} 호스트 제거는 실제 cluster.json 호스트 목록과 remove API payload 매핑을 확인한 뒤 연결해야 합니다.`,
    });
  };

  const closeActionProgressModal = () => {
    setActionProgress((prev) => ({ ...prev, isOpen: false }));
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
                <DropdownItem onClick={openExternalStorageSyncModal}>
                  외부 스토리지 동기화
                </DropdownItem>
                <DropdownItem onClick={openExternalStorageRescanModal}>
                  외부 스토리지 재검색
                </DropdownItem>
                <DropdownItem onClick={openWwnListModal}>
                  WWN 목록 조회
                </DropdownItem>
                <DropdownItem onClick={openHostRemoveModal}>
                  호스트 제거
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
                <span>GFS 리소스 상태</span>
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
            <DescriptionListTerm>GFS 장치 상태</DescriptionListTerm>
            <DescriptionListDescription>
              {renderStatusDetail(data.gfsDeviceStatus, undefined, data.gfsDeviceDetails)}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>

      <CardFooter
        className="ct-status-card__footer"
        style={{ color: isCollecting ? "#f0ab00" : data.footerColor }}
      >
        {isCollecting ? (
          <StatusLoadingMessage>GFS 리소스 상태 체크 중...</StatusLoadingMessage>
        ) : data.footerMessage}
      </CardFooter>

      <CheckedConfirmActionModal
        isOpen={isExternalStorageSyncModalOpen}
        title="외부 스토리지 동기화"
        message="동기화를 진행하시겠습니까?"
        warning="해당 장치는 반드시 이중화되어 있어야 합니다. 만약 싱글 패스로 구성되어 있다면 실행하지 마세요."
        checkLabel="외부 스토리지 설정 확인"
        onClose={closeExternalStorageSyncModal}
        onConfirm={confirmExternalStorageSync}
      />

      <CheckedConfirmActionModal
        isOpen={isExternalStorageRescanModalOpen}
        title="외부 스토리지 재검색"
        message="재검색을 진행하시겠습니까?"
        warning="외부 스토리지를 먼저 연결해주시기 바랍니다. 스토리지에서 연결이 정상적으로 확인된 후, 작업을 진행해주시기 바랍니다."
        checkLabel="외부 스토리지 연결 확인"
        onClose={closeExternalStorageRescanModal}
        onConfirm={confirmExternalStorageRescan}
      />

      <WwnListModal
        isOpen={isWwnListModalOpen}
        onClose={closeWwnListModal}
      />

      <SelectActionModal
        isOpen={isHostRemoveModalOpen}
        title="호스트 제거"
        message="제거할 호스트를 선택해 주세요."
        selectLabel="호스트"
        options={[
          { value: "ablecube1", label: "ablecube1" },
          { value: "ablecube2", label: "ablecube2" },
          { value: "ablecube3", label: "ablecube3" },
        ]}
        warning="호스트를 제거하면 해당 호스트는 클러스터에서 제외되며, 더 이상 자원을 사용할 수 없습니다."
        checkLabel="호스트명 확인"
        onClose={closeHostRemoveModal}
        onConfirm={confirmHostRemove}
      />

      <ActionProgressModal
        isOpen={actionProgress.isOpen}
        title={actionProgress.title}
        phase={actionProgress.phase}
        message={actionProgress.message}
        onClose={closeActionProgressModal}
      />
    </Card>
  );
}
