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

import {
  STATUS_LOADING_LABEL,
  STATUS_UNKNOWN_LABEL,
  StatusLoadingMessage,
} from "./status-loading";
import WwnListModal from "./wwn-list-modal";
import ActionProgressModal from "../components/common/ActionProgressModal";
import type { ActionProgressPhase } from "../components/common/ActionProgressModal";
import CheckedConfirmActionModal from "../components/common/CheckedConfirmActionModal";
import SelectActionModal from "../components/common/SelectActionModal";
import { useStatusPolling } from "../hooks/useStatusPolling";
import {
  fetchGfsResourceStatus,
  GFS_RESOURCE_STATUS_FALLBACK,
} from "../services/api/gfs-resource-status";
import {
  formatMultipathSyncAction,
  runMultipathSync,
  summarizeMultipathSyncResult,
  type MultipathSyncAction,
} from "../services/api/multipath-sync";
import {
  DotStatus,
  InfoGrid,
  InfoItem,
  StatusCardHeading,
} from "./status-card-layout";
import "./status-card.scss";

const STATUS_META = {
  HEALTH_OK: {
    label: "Health OK",
    color: "green",
  },
  HEALTH_WARN: {
    label: "Health Warn",
    color: "orange",
  },
  HEALTH_ERR: {
    label: "Health Err",
    color: "red",
  },
};

export default function GfsResourceStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isExternalStorageSyncModalOpen, setIsExternalStorageSyncModalOpen] = React.useState(false);
  const [isExternalStorageRescanModalOpen, setIsExternalStorageRescanModalOpen] = React.useState(false);
  const [isWwnListModalOpen, setIsWwnListModalOpen] = React.useState(false);
  const [isHostRemoveModalOpen, setIsHostRemoveModalOpen] = React.useState(false);
  const [multipathProgress, setMultipathProgress] = React.useState<{
    isOpen: boolean;
    title: string;
    phase: ActionProgressPhase;
    message: string;
  }>({
    isOpen: false,
    title: "외부 스토리지 동기화",
    phase: "running",
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

  const runExternalStorageAction = async (action: MultipathSyncAction) => {
    const title = formatMultipathSyncAction(action);

    setMultipathProgress({
      isOpen: true,
      title,
      phase: "running",
      message: `${title}을 실행하고 있습니다.`,
    });

    try {
      const result = await runMultipathSync(action);

      setMultipathProgress({
        isOpen: true,
        title,
        phase: "success",
        message: summarizeMultipathSyncResult(result, `${title}이 완료되었습니다.`),
      });
    } catch (error) {
      console.error("multipath sync API error:", error);
      setMultipathProgress({
        isOpen: true,
        title,
        phase: "error",
        message: error instanceof Error
          ? error.message
          : `${title}에 실패했습니다.`,
      });
    }
  };

  const closeMultipathProgressModal = () => {
    setMultipathProgress((prev) => ({ ...prev, isOpen: false }));
  };

  const confirmExternalStorageSync = () => {
    setIsExternalStorageSyncModalOpen(false);
    void runExternalStorageAction("sync");
  };

  const openExternalStorageRescanModal = () => {
    setIsExternalStorageRescanModalOpen(true);
    setIsOpen(false);
  };

  const closeExternalStorageRescanModal = () => {
    setIsExternalStorageRescanModalOpen(false);
  };

  const confirmExternalStorageRescan = () => {
    setIsExternalStorageRescanModalOpen(false);
    void runExternalStorageAction("rescan");
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
    // TODO: 백엔드 API 전환 후 GFS host remove API로 연결합니다.
    console.log("gfs host remove", hostname);
    setIsHostRemoveModalOpen(false);
  };

  const statusDetail = (statusKey: string) => (
    isCollecting
      ? {
        label: STATUS_LOADING_LABEL,
        color: "orange",
      }
      : (STATUS_META as any)[statusKey] ?? {
        label: statusKey || STATUS_UNKNOWN_LABEL,
        color: "orange",
      }
  );
  const fenceStatus = statusDetail(data.fenceDeviceStatus);
  const lockStatus = statusDetail(data.lockDeviceStatus);

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
                <DropdownGroup label="외부 스토리지" className="ct-status-card__menu-group">
                  <DropdownItem onClick={openExternalStorageSyncModal}>
                    외부 스토리지 동기화
                  </DropdownItem>
                  <DropdownItem onClick={openExternalStorageRescanModal}>
                    외부 스토리지 재검색
                  </DropdownItem>
                </DropdownGroup>
                <DropdownGroup label="장치 정보" className="ct-status-card__menu-group">
                  <DropdownItem onClick={openWwnListModal}>
                    WWN 목록 조회
                  </DropdownItem>
                </DropdownGroup>
                <DropdownGroup label="호스트 관리" className="ct-status-card__menu-group">
                  <DropdownItem onClick={openHostRemoveModal}>
                    호스트 제거
                  </DropdownItem>
                </DropdownGroup>
              </DropdownList>
            </Dropdown>
          ),
        }}
      >
        <CardTitle>
          <StatusCardHeading
            icon={<span className="ct-status-card__emoji" aria-hidden="true">⛓</span>}
            title="GFS 리소스 상태"
            subtitle="Global File System"
            tone="gfs"
          />
        </CardTitle>
      </CardHeader>

      <CardBody>
        <InfoGrid>
          <InfoItem label="펜스 장치 상태">
            <DotStatus tone={fenceStatus.color}>
              {fenceStatus.label}
            </DotStatus>
          </InfoItem>
          <InfoItem label="잠금 장치 상태">
            <DotStatus tone={lockStatus.color}>
              {lockStatus.label}
            </DotStatus>
          </InfoItem>
          <InfoItem label="펜스 장치 상세" full mono>
            {data.fenceDeviceDetail || "N/A"}
          </InfoItem>
          <InfoItem label="잠금 장치 상세" full mono>
            <span className="ct-status-card__line-stack">
              {data.lockDeviceDetails.length > 0
                ? data.lockDeviceDetails.map((line, index) => (
                    <span key={`${line}-${index}`}>{line}</span>
                  ))
                : <span>N/A</span>}
            </span>
          </InfoItem>
        </InfoGrid>
      </CardBody>

      <CardFooter
        className="ct-status-card__footer"
        style={{ color: isCollecting ? "#f0ab00" : data.footerColor }}
      >
        {isCollecting ? (
          <StatusLoadingMessage>GFS 리소스 상태를 확인하고 있습니다.</StatusLoadingMessage>
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

      <ActionProgressModal
        isOpen={multipathProgress.isOpen}
        title={multipathProgress.title}
        phase={multipathProgress.phase}
        message={multipathProgress.message}
        onClose={closeMultipathProgressModal}
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
    </Card>
  );
}
