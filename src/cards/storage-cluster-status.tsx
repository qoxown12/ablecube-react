import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Label,
  Button,
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
  ExclamationCircleIcon,
  EllipsisVIcon,
  SearchIcon,
} from "@patternfly/react-icons";

import ClvmDiskActionModal from "./clvm-disk-action-modal";
import type { ClvmDiskAction, ClvmDiskActionSelection } from "./clvm-disk-action-modal";
import StorageClusterHealthChecksModal from "./storage-cluster-health-checks-modal";
import {
  STATUS_LOADING_LABEL,
  STATUS_UNKNOWN_LABEL,
  StatusLoadingIcon,
  StatusLoadingMessage,
} from "./status-loading";
import WwnListModal from "./wwn-list-modal";
import CheckedConfirmActionModal from "../components/common/CheckedConfirmActionModal";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import MaintenanceModeConfirmModal from "../components/common/MaintenanceModeConfirmModal";
import type { MaintenanceModeAction } from "../components/common/MaintenanceModeConfirmModal";
import ActionProgressModal from "../components/common/ActionProgressModal";
import type { ActionProgressPhase } from "../components/common/ActionProgressModal";
import { useStatusPolling } from "../hooks/useStatusPolling";
import {
  runAutoShutdownSequence,
} from "../services/api/auto-shutdown";
import {
  createClvmDisks,
  deleteClvmDisks,
} from "../services/api/clvm-manage";
import { scanGfsStorageDevices } from "../services/api/gfs-manage";
import {
  fetchStorageCenterUrl,
  fetchStorageClusterStatus,
  STORAGE_CLUSTER_STATUS_FALLBACK,
  type StorageClusterStatusData,
  updateGlueConfigAllHosts,
  updateStorageClusterMaintenanceMode,
} from "../services/api/storage-cluster-status";
import "./status-card.scss";

const CLUSTER_STATUS_META = {
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
    icon: <ExclamationCircleIcon />,
  },
};

export default function StorageClusterStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMaintenance, setIsMaintenance] = React.useState(false);
  const [maintenanceModeToConfirm, setMaintenanceModeToConfirm] =
    React.useState<MaintenanceModeAction | null>(null);
  const [maintenanceProgress, setMaintenanceProgress] = React.useState<{
    isOpen: boolean;
    phase: ActionProgressPhase;
    message: string;
  }>({
    isOpen: false,
    phase: "running",
    message: "",
  });
  const [glueUpdateProgress, setGlueUpdateProgress] = React.useState<{
    isOpen: boolean;
    phase: ActionProgressPhase;
    message: string;
  }>({
    isOpen: false,
    phase: "running",
    message: "",
  });
  const [isGlueUpdateModalOpen, setIsGlueUpdateModalOpen] = React.useState(false);
  const [isExternalStorageSyncModalOpen, setIsExternalStorageSyncModalOpen] = React.useState(false);
  const [isExternalStorageRescanModalOpen, setIsExternalStorageRescanModalOpen] = React.useState(false);
  const [externalStorageProgress, setExternalStorageProgress] = React.useState<{
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
  const [clvmDiskAction, setClvmDiskAction] = React.useState<ClvmDiskAction | null>(null);
  const [clvmProgress, setClvmProgress] = React.useState<{
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
  const [isWwnListModalOpen, setIsWwnListModalOpen] = React.useState(false);
  const [isAutoShutdownModalOpen, setIsAutoShutdownModalOpen] = React.useState(false);
  const [autoShutdownProgress, setAutoShutdownProgress] = React.useState<{
    isOpen: boolean;
    phase: ActionProgressPhase;
    message: string;
  }>({
    isOpen: false,
    phase: "running",
    message: "",
  });
  const [isRemoveCubeHostModalOpen, setIsRemoveCubeHostModalOpen] = React.useState(false);
  const [isHealthChecksModalOpen, setIsHealthChecksModalOpen] = React.useState(false);
  const [storageCenterConnectionError, setStorageCenterConnectionError] = React.useState("");

  const handleStatusLoad = React.useCallback((nextData: StorageClusterStatusData) => {
    setIsMaintenance(nextData.maintenanceStatus);
  }, []);
  const handleStatusError = React.useCallback((error: unknown) => {
    console.error("storage cluster status API error:", error);
    setIsMaintenance(false);
  }, []);
  const { data, isCollecting } = useStatusPolling({
    fetcher: fetchStorageClusterStatus,
    fallback: STORAGE_CLUSTER_STATUS_FALLBACK,
    onSuccess: handleStatusLoad,
    onError: handleStatusError,
  });

  const statusMeta = isCollecting
    ? {
      label: STATUS_LOADING_LABEL,
      color: "orange",
      icon: <StatusLoadingIcon />,
    }
    : (CLUSTER_STATUS_META as any)[data.clusterStatus] ?? {
      label: STATUS_UNKNOWN_LABEL,
      color: "orange",
      icon: <InfoCircleIcon />,
    };

  const isClusterError = data.clusterStatus === "HEALTH_ERR";
  const isClusterUnknown = data.clusterStatus === "N/A" || data.clusterStatus === "";
  const canOpenHealthChecks =
    !isCollecting && !isClusterUnknown && data.clusterStatus !== "HEALTH_OK";
  const footerMessage = isCollecting
    ? "스토리지센터 클러스터 상태 체크 중..."
    : isClusterUnknown
    ? "스토리지센터 클러스터 상태 정보를 확인할 수 없습니다."
    : isClusterError
      ? "스토리지센터 클러스터가 구성되지 않았습니다."
      : "스토리지센터 클러스터가 구성되었습니다.";
  const footerColor = isCollecting ? "#f0ab00" : isClusterUnknown ? "#f0ab00" : isClusterError ? "#c9190b" : "#3e8635";

  const onSelect = () => setIsOpen(false);

  const openMaintenanceModeModal = (mode: MaintenanceModeAction) => {
    setMaintenanceModeToConfirm(mode);
    setIsOpen(false);
  };

  const closeMaintenanceModeModal = () => {
    setMaintenanceModeToConfirm(null);
  };

  const confirmMaintenanceModeChange = async () => {
    if (!maintenanceModeToConfirm) return;

    const mode = maintenanceModeToConfirm;
    const isNextMaintenance = mode === "set";
    const actionLabel = isNextMaintenance ? "설정" : "해제";

    setMaintenanceModeToConfirm(null);
    setMaintenanceProgress({
      isOpen: true,
      phase: "running",
      message: "스토리지 클러스터 유지보수모드 변경중입니다.",
    });

    try {
      await updateStorageClusterMaintenanceMode(mode);
      sessionStorage.setItem(
        "storage_cluster_maintenance_status",
        String(isNextMaintenance)
      );
      setIsMaintenance(isNextMaintenance);
      setMaintenanceProgress({
        isOpen: true,
        phase: "success",
        message: `스토리지 클러스터 유지보수 모드 ${actionLabel}이 완료되었습니다.`,
      });
    } catch (error) {
      console.error("storage cluster maintenance mode update API error:", error);
      setMaintenanceProgress({
        isOpen: true,
        phase: "error",
        message: error instanceof Error
          ? error.message
          : "스토리지 클러스터 유지보수 모드 변경 요청에 실패했습니다.",
      });
    }
  };

  const closeMaintenanceProgressModal = () => {
    setMaintenanceProgress((prev) => ({ ...prev, isOpen: false }));
  };

  const openGlueUpdateModal = () => {
    setIsGlueUpdateModalOpen(true);
    setIsOpen(false);
  };

  const openStorageCenter = async () => {
    setIsOpen(false);

    const storageCenterWindow = window.open("about:blank", "_blank");

    if (!storageCenterWindow) {
      setStorageCenterConnectionError("브라우저 팝업 차단을 해제한 후 다시 시도해주세요.");
      return;
    }

    try {
      storageCenterWindow.document.title = "스토리지센터 연결";
      storageCenterWindow.document.body.textContent = "스토리지센터 주소를 확인하는 중입니다.";

      const storageCenterUrl = await fetchStorageCenterUrl();

      storageCenterWindow.opener = null;
      storageCenterWindow.location.href = storageCenterUrl;
    } catch (error) {
      storageCenterWindow.close();
      console.error("storage center url API error:", error);
      setStorageCenterConnectionError(
        error instanceof Error
          ? error.message
          : "스토리지센터 연결 주소 조회에 실패했습니다."
      );
    }
  };

  const closeGlueUpdateModal = () => {
    setIsGlueUpdateModalOpen(false);
  };

  const confirmGlueUpdate = async () => {
    setIsGlueUpdateModalOpen(false);
    setGlueUpdateProgress({
      isOpen: true,
      phase: "running",
      message: "전체 호스트 Glue 설정 업데이트를 진행중입니다.",
    });

    try {
      await updateGlueConfigAllHosts();
      setGlueUpdateProgress({
        isOpen: true,
        phase: "success",
        message: "전체 호스트 Glue 설정 업데이트가 완료되었습니다.",
      });
    } catch (error) {
      console.error("glue config update API error:", error);
      setGlueUpdateProgress({
        isOpen: true,
        phase: "error",
        message: error instanceof Error
          ? error.message
          : "전체 호스트 Glue 설정 업데이트에 실패했습니다.",
      });
    }
  };

  const closeGlueUpdateProgressModal = () => {
    setGlueUpdateProgress((prev) => ({ ...prev, isOpen: false }));
  };

  const openExternalStorageSyncModal = () => {
    setIsExternalStorageSyncModalOpen(true);
    setIsOpen(false);
  };

  const closeExternalStorageSyncModal = () => {
    setIsExternalStorageSyncModalOpen(false);
  };

  const confirmExternalStorageSync = () => {
    setIsExternalStorageSyncModalOpen(false);
    setExternalStorageProgress({
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
    setExternalStorageProgress({
      isOpen: true,
      phase: "running",
      title: "외부 스토리지 재검색",
      message: "외부 스토리지 재검색을 진행중입니다.",
    });

    try {
      await scanGfsStorageDevices();
      setExternalStorageProgress({
        isOpen: true,
        phase: "success",
        title: "외부 스토리지 재검색",
        message: "외부 스토리지 재검색이 완료되었습니다.",
      });
    } catch (error) {
      console.error("external storage rescan API error:", error);
      setExternalStorageProgress({
        isOpen: true,
        phase: "error",
        title: "외부 스토리지 재검색",
        message: error instanceof Error
          ? error.message
          : "외부 스토리지 재검색에 실패했습니다.",
      });
    }
  };

  const closeExternalStorageProgressModal = () => {
    setExternalStorageProgress((prev) => ({ ...prev, isOpen: false }));
  };

  const openClvmDiskActionModal = (action: ClvmDiskAction) => {
    setClvmDiskAction(action);
    setIsOpen(false);
  };

  const closeClvmDiskActionModal = () => {
    setClvmDiskAction(null);
  };

  const confirmClvmDiskAction = async (
    action: Exclude<ClvmDiskAction, "info">,
    selection: ClvmDiskActionSelection
  ) => {
    setClvmDiskAction(null);
    const title = action === "add" ? "CLVM 디스크 추가" : "CLVM 디스크 삭제";

    setClvmProgress({
      isOpen: true,
      phase: "running",
      title,
      message: `${title}를 진행중입니다.`,
    });

    try {
      if (action === "add") {
        await createClvmDisks(selection.selectedIds);
      } else {
        await deleteClvmDisks(selection.selectedClvmDisks);
      }

      setClvmProgress({
        isOpen: true,
        phase: "success",
        title,
        message: `${title}가 완료되었습니다.`,
      });
    } catch (error) {
      console.error("CLVM disk action API error:", error);
      setClvmProgress({
        isOpen: true,
        phase: "error",
        title,
        message: error instanceof Error
          ? error.message
          : `${title}에 실패했습니다.`,
      });
    }
  };

  const closeClvmProgressModal = () => {
    setClvmProgress((prev) => ({ ...prev, isOpen: false }));
  };

  const openWwnListModal = () => {
    setIsWwnListModalOpen(true);
    setIsOpen(false);
  };

  const closeWwnListModal = () => {
    setIsWwnListModalOpen(false);
  };

  const openAutoShutdownModal = () => {
    setIsAutoShutdownModalOpen(true);
    setIsOpen(false);
  };

  const closeAutoShutdownModal = () => {
    setIsAutoShutdownModalOpen(false);
  };

  const confirmAutoShutdown = async () => {
    setIsAutoShutdownModalOpen(false);
    setAutoShutdownProgress({
      isOpen: true,
      phase: "running",
      message: "전체 시스템 자동 종료 절차를 진행중입니다.",
    });

    try {
      await runAutoShutdownSequence();
      setAutoShutdownProgress({
        isOpen: true,
        phase: "success",
        message: "전체 시스템 자동 종료 절차 요청이 완료되었습니다.",
      });
    } catch (error) {
      console.error("auto shutdown API error:", error);
      setAutoShutdownProgress({
        isOpen: true,
        phase: "error",
        message: error instanceof Error
          ? error.message
          : "전체 시스템 자동 종료 절차에 실패했습니다.",
      });
    }
  };

  const closeAutoShutdownProgressModal = () => {
    setAutoShutdownProgress((prev) => ({ ...prev, isOpen: false }));
  };

  const openRemoveCubeHostModal = () => {
    setIsRemoveCubeHostModalOpen(true);
    setIsOpen(false);
  };

  const closeRemoveCubeHostModal = () => {
    setIsRemoveCubeHostModalOpen(false);
  };

  const confirmRemoveCubeHost = () => {
    setIsRemoveCubeHostModalOpen(false);
    setClvmProgress({
      isOpen: true,
      phase: "error",
      title: "Cube 호스트 제거",
      message: "Cube 호스트 제거는 실제 cluster.json 호스트 목록과 remove API payload 매핑을 확인한 뒤 연결해야 합니다.",
    });
  };

  const closeHealthChecksModal = () => {
    setIsHealthChecksModalOpen(false);
  };

  const closeStorageCenterConnectionError = () => {
    setStorageCenterConnectionError("");
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
                <DropdownItem
                  isDisabled={isMaintenance}
                  onClick={() => openMaintenanceModeModal("set")}
                >
                  유지보수 모드 설정
                </DropdownItem>

                <DropdownItem
                  isDisabled={!isMaintenance}
                  onClick={() => openMaintenanceModeModal("unset")}
                >
                  유지보수 모드 해제
                </DropdownItem>

                <DropdownItem
                  onClick={openStorageCenter}
                >
                  스토리지센터 연결
                </DropdownItem>

                <DropdownItem
                  onClick={openGlueUpdateModal}
                >
                  전체 호스트 Glue 설정 업데이트
                </DropdownItem>
                
                <DropdownItem
                  onClick={openExternalStorageSyncModal}
                >
                  외부 스토리지 동기화
                </DropdownItem>

                <DropdownItem
                  onClick={openExternalStorageRescanModal}
                >
                  외부 스토리지 재검색
                </DropdownItem>

                <DropdownItem
                  onClick={() => openClvmDiskActionModal("add")}
                >
                  CLVM 디스크 추가
                </DropdownItem>
                <DropdownItem
                  onClick={() => openClvmDiskActionModal("delete")}
                >
                  CLVM 디스크 삭제
                </DropdownItem>
                <DropdownItem
                  onClick={() => openClvmDiskActionModal("info")}
                >
                  CLVM 디스크 정보
                </DropdownItem>
                <DropdownItem
                  onClick={openWwnListModal}
                >
                  WWN 목록 조회
                </DropdownItem>
                <DropdownItem
                  onClick={openAutoShutdownModal}
                >
                  전체 시스템 자동 종료
                </DropdownItem>
                <DropdownItem
                  onClick={openRemoveCubeHostModal}
                >
                  Cube 호스트 제거
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
                <span>스토리지센터 클러스터 상태</span>
              </Flex>
            </CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody>
        <DescriptionList isCompact className="ct-status-card__dl">
          <DescriptionListGroup>
            <DescriptionListTerm>클러스터 상태</DescriptionListTerm>
            <DescriptionListDescription>
              <span className="ct-health-status">
                <Label
                  className="ct-health-label"
                  color={statusMeta.color}
                  icon={statusMeta.icon}
                >
                  {statusMeta.label}
                </Label>
                {canOpenHealthChecks ? (
                  <Button
                    variant="plain"
                    aria-label="스토리지 클러스터 Health 상세 보기"
                    className="ct-health-detail-button"
                    onClick={() => setIsHealthChecksModalOpen(true)}
                  >
                    <SearchIcon aria-hidden="true" />
                  </Button>
                ) : null}
              </span>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>디스크</DescriptionListTerm>
            <DescriptionListDescription>{data.diskStatus}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>게이트웨이</DescriptionListTerm>
            <DescriptionListDescription>{data.gatewayStatus}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>관리데몬</DescriptionListTerm>
            <DescriptionListDescription>{data.daemonStatus}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>스토리지 풀</DescriptionListTerm>
            <DescriptionListDescription>{data.storagePools}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>스토리지 용량</DescriptionListTerm>
            <DescriptionListDescription>{data.storageCapacity}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>

      <CardFooter className="ct-status-card__footer" style={{ color: footerColor }}>
        {isCollecting ? (
          <StatusLoadingMessage>{footerMessage}</StatusLoadingMessage>
        ) : footerMessage}
      </CardFooter>

      <MaintenanceModeConfirmModal
        isOpen={maintenanceModeToConfirm !== null}
        mode={maintenanceModeToConfirm ?? "set"}
        subject="스토리지 클러스터"
        onClose={closeMaintenanceModeModal}
        onConfirm={confirmMaintenanceModeChange}
      />

      <ActionProgressModal
        isOpen={maintenanceProgress.isOpen}
        title="스토리지 클러스터 유지보수 모드 변경"
        phase={maintenanceProgress.phase}
        message={maintenanceProgress.message}
        onClose={closeMaintenanceProgressModal}
      />

      <StorageClusterHealthChecksModal
        isOpen={isHealthChecksModalOpen}
        checks={data.healthChecks}
        onClose={closeHealthChecksModal}
      />

      <ActionProgressModal
        isOpen={Boolean(storageCenterConnectionError)}
        title="스토리지센터 연결"
        phase="error"
        message={storageCenterConnectionError}
        onClose={closeStorageCenterConnectionError}
      />

      <ConfirmActionModal
        isOpen={isGlueUpdateModalOpen}
        title="전체 호스트 Glue 설정 업데이트"
        message="전체 호스트 Glue 설정 업데이트를 진행하시겠습니까?"
        onClose={closeGlueUpdateModal}
        onConfirm={confirmGlueUpdate}
      />

      <ActionProgressModal
        isOpen={glueUpdateProgress.isOpen}
        title="전체 호스트 Glue 설정 업데이트"
        phase={glueUpdateProgress.phase}
        message={glueUpdateProgress.message}
        onClose={closeGlueUpdateProgressModal}
      />

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
        isOpen={externalStorageProgress.isOpen}
        title={externalStorageProgress.title}
        phase={externalStorageProgress.phase}
        message={externalStorageProgress.message}
        onClose={closeExternalStorageProgressModal}
      />

      <ClvmDiskActionModal
        action={clvmDiskAction}
        isOpen={clvmDiskAction !== null}
        onClose={closeClvmDiskActionModal}
        onConfirm={confirmClvmDiskAction}
      />

      <ActionProgressModal
        isOpen={clvmProgress.isOpen}
        title={clvmProgress.title}
        phase={clvmProgress.phase}
        message={clvmProgress.message}
        onClose={closeClvmProgressModal}
      />

      <WwnListModal
        isOpen={isWwnListModalOpen}
        onClose={closeWwnListModal}
      />

      <CheckedConfirmActionModal
        isOpen={isAutoShutdownModalOpen}
        title="전체 시스템 종료 절차 실행"
        message="전체 시스템을 '종료' 하시겠습니까?"
        warning="사전에 각 호스트에 Mount된 볼륨을 작업 수행자가 직접 해제해야 합니다. 해제 후, 아래 볼륨 마운트 해제 확인을 체크하여 계속 진행합니다."
        checkLabel="볼륨 마운트 해제 확인"
        onClose={closeAutoShutdownModal}
        onConfirm={confirmAutoShutdown}
      />

      <ActionProgressModal
        isOpen={autoShutdownProgress.isOpen}
        title="전체 시스템 자동 종료"
        phase={autoShutdownProgress.phase}
        message={autoShutdownProgress.message}
        onClose={closeAutoShutdownProgressModal}
      />

      <CheckedConfirmActionModal
        isOpen={isRemoveCubeHostModalOpen}
        title="Cube 호스트 제거"
        message="Cube 호스트 제거를 진행하시겠습니까?"
        warning="주의!! 실행하실 경우 cube 호스트 설정정보가 초기화 됩니다."
        checkLabel="Cube 호스트 제거 확인"
        onClose={closeRemoveCubeHostModal}
        onConfirm={confirmRemoveCubeHost}
      />
    </Card>
  );
}
