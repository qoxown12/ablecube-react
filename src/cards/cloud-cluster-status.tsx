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
  NetworkIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  EllipsisVIcon,
} from "@patternfly/react-icons";

import CloudClusterMigrationModal from "./cloud-cluster-migration-modal";
import SshPortChangeModal from "./ssh-port-change-modal";
import {
  STATUS_LOADING_LABEL,
  STATUS_UNKNOWN_LABEL,
  StatusLoadingIcon,
  StatusLoadingMessage,
} from "./status-loading";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import ActionProgressModal from "../components/common/ActionProgressModal";
import type { ActionProgressPhase } from "../components/common/ActionProgressModal";
import { useStatusPolling } from "../hooks/useStatusPolling";
import {
  changeClusterSshPort,
  cleanupCloudCenterCluster,
  CLOUD_CLUSTER_STATUS_FALLBACK,
  fetchCloudClusterStatus,
  migrateCloudCenterVm,
  setupCloudCenterCluster,
  startCloudCenterVm,
  stopCloudCenterVm,
} from "../services/api/cloud-cluster-status";
import {
  fetchCloudCenterUrl,
  fetchMonitoringCenterUrl,
} from "../services/api/url";
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

type CloudClusterConfirmAction =
  | "start"
  | "stop"
  | "cleanup"
  | "bootstrap"
  | "connect"
  | "monitoringSetup"
  | "monitoringDashboard"
  | "monitoringConfigUpdate";

const CLOUD_CLUSTER_ACTIONS: Record<
CloudClusterConfirmAction,
{ title: string; message: string; confirmLabel?: string }
> = {
  start: {
    title: "클라우드센터VM 시작",
    message: "클라우드센터VM을 시작하시겠습니까?",
  },
  stop: {
    title: "클라우드센터VM 정지",
    message: "클라우드센터VM을 정지하시겠습니까?",
  },
  cleanup: {
    title: "클라우드센터 클러스터 클린업",
    message: "클라우드센터 클러스터를 클린업하시겠습니까?",
  },
  bootstrap: {
    title: "클라우드센터 구성하기",
    message: "클라우드센터 구성을 진행하시겠습니까?",
  },
  connect: {
    title: "클라우드센터 연결",
    message: "클라우드센터 관리 화면으로 연결하시겠습니까?",
    confirmLabel: "연결",
  },
  monitoringSetup: {
    title: "모니터링센터 구성",
    message: "모니터링센터 구성을 진행하시겠습니까?",
  },
  monitoringDashboard: {
    title: "모니터링센터 대시보드 연결",
    message: "모니터링센터 대시보드로 연결하시겠습니까?",
    confirmLabel: "연결",
  },
  monitoringConfigUpdate: {
    title: "모니터링센터 수집 정보 업데이트",
    message: "모니터링센터 수집 정보를 업데이트하시겠습니까?",
  },
};

const parseMigrationNodes = (nodeStatus: string, executionNode: string) => {
  const match = nodeStatus.match(/\(([^)]+)\)/);
  const nodes = match
    ? match[1].split(",").map((node) => node.trim()).filter(Boolean)
    : [""];

  return nodes.filter((node) => node !== executionNode);
};

export default function CloudClusterStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<CloudClusterConfirmAction | null>(null);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = React.useState(false);
  const [isSshPortChangeModalOpen, setIsSshPortChangeModalOpen] = React.useState(false);
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
    console.error("cloud cluster status API error:", error);
  }, []);
  const { data, isCollecting } = useStatusPolling({
    fetcher: fetchCloudClusterStatus,
    fallback: CLOUD_CLUSTER_STATUS_FALLBACK,
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
  const footerMessage = isCollecting
    ? "클라우드센터 클러스터 상태 체크 중..."
    : isClusterUnknown
    ? "클라우드센터 클러스터 상태 정보를 확인할 수 없습니다."
    : isClusterError
      ? "클라우드센터 클러스터가 구성되지 않았습니다."
      : "클라우드센터 클러스터가 구성되었습니다.";
  const footerColor = isCollecting ? "#f0ab00" : isClusterUnknown ? "#f0ab00" : isClusterError ? "#c9190b" : "#3e8635";
  const isClusterReady = data.clusterStatus === "HEALTH_OK";
  const isCloudVmRunning = data.resourceStatus === "실행중";
  const migrationNodes = parseMigrationNodes(data.nodeStatus, data.executionNode);
  const currentConfirmAction = confirmAction ? CLOUD_CLUSTER_ACTIONS[confirmAction] : null;

  const onSelect = () => setIsOpen(false);

  const openConfirmActionModal = (action: CloudClusterConfirmAction) => {
    setConfirmAction(action);
    setIsOpen(false);
  };

  const closeConfirmActionModal = () => {
    setConfirmAction(null);
  };

  const runProgressAction = async (
    title: string,
    runningMessage: string,
    successMessage: string,
    fallbackErrorMessage: string,
    actionRunner: () => Promise<void>
  ) => {
    setActionProgress({
      isOpen: true,
      phase: "running",
      title,
      message: runningMessage,
    });

    try {
      await actionRunner();
      setActionProgress({
        isOpen: true,
        phase: "success",
        title,
        message: successMessage,
      });
    } catch (error) {
      console.error(`${title} API error:`, error);
      setActionProgress({
        isOpen: true,
        phase: "error",
        title,
        message: error instanceof Error ? error.message : fallbackErrorMessage,
      });
    }
  };

  const openExternalUrl = async (title: string, fetcher: () => Promise<string>) => {
    const targetWindow = window.open("about:blank", "_blank");

    if (!targetWindow) {
      setActionProgress({
        isOpen: true,
        phase: "error",
        title,
        message: "브라우저 팝업 차단을 해제한 후 다시 시도해주세요.",
      });
      return;
    }

    try {
      targetWindow.document.title = title;
      targetWindow.document.body.textContent = "연결 주소를 확인하는 중입니다.";

      const url = await fetcher();

      targetWindow.opener = null;
      targetWindow.location.href = url;
    } catch (error) {
      targetWindow.close();
      setActionProgress({
        isOpen: true,
        phase: "error",
        title,
        message: error instanceof Error
          ? error.message
          : `${title} 주소 조회에 실패했습니다.`,
      });
    }
  };

  const confirmCloudClusterAction = () => {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);

    if (action === "connect") {
      void openExternalUrl("클라우드센터 연결", fetchCloudCenterUrl);
      return;
    }

    if (action === "monitoringDashboard") {
      void openExternalUrl("모니터링센터 대시보드 연결", fetchMonitoringCenterUrl);
      return;
    }

    if (action === "monitoringSetup" || action === "monitoringConfigUpdate") {
      setActionProgress({
        isOpen: true,
        phase: "error",
        title: CLOUD_CLUSTER_ACTIONS[action].title,
        message: "모니터링센터 구성/수집 정보 업데이트는 SMTP, 대상 IP 등 추가 입력 화면이 필요해 후속 이관 대상으로 남겨두었습니다.",
      });
      return;
    }

    const runners: Record<
      Exclude<CloudClusterConfirmAction, "connect" | "monitoringSetup" | "monitoringDashboard" | "monitoringConfigUpdate">,
      () => Promise<void>
    > = {
      start: startCloudCenterVm,
      stop: stopCloudCenterVm,
      cleanup: cleanupCloudCenterCluster,
      bootstrap: setupCloudCenterCluster,
    };
    const title = CLOUD_CLUSTER_ACTIONS[action].title;

    void runProgressAction(
      title,
      `${title}를 진행중입니다.`,
      `${title}가 완료되었습니다.`,
      `${title}에 실패했습니다.`,
      runners[action]
    );
  };

  const openMigrationModal = () => {
    setIsMigrationModalOpen(true);
    setIsOpen(false);
  };

  const closeMigrationModal = () => {
    setIsMigrationModalOpen(false);
  };

  const confirmMigration = (targetNode: string) => {
    setIsMigrationModalOpen(false);
    void runProgressAction(
      "클라우드센터VM 마이그레이션",
      "클라우드센터VM 마이그레이션을 진행중입니다.",
      "클라우드센터VM 마이그레이션이 완료되었습니다.",
      "클라우드센터VM 마이그레이션에 실패했습니다.",
      () => migrateCloudCenterVm(targetNode)
    );
  };

  const openSshPortChangeModal = () => {
    setIsSshPortChangeModalOpen(true);
    setIsOpen(false);
  };

  const closeSshPortChangeModal = () => {
    setIsSshPortChangeModalOpen(false);
  };

  const confirmSshPortChange = (beforePort: string, afterPort: string) => {
    setIsSshPortChangeModalOpen(false);
    void runProgressAction(
      "SSH Port 변경",
      "SSH Port 변경을 진행중입니다.",
      "SSH Port 변경이 완료되었습니다.",
      "SSH Port 변경에 실패했습니다.",
      () => changeClusterSshPort(Number(beforePort), Number(afterPort))
    );
  };

  const closeActionProgressModal = () => {
    setActionProgress((prev) => ({ ...prev, isOpen: false }));
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
                  isDisabled={!isClusterReady || isCloudVmRunning}
                  onClick={() => openConfirmActionModal("start")}
                >
                  클라우드센터VM 시작
                </DropdownItem>

                <DropdownItem
                  isDisabled={!isClusterReady || !isCloudVmRunning}
                  onClick={() => openConfirmActionModal("stop")}
                >
                  클라우드센터VM 정지
                </DropdownItem>

                <DropdownItem
                  isDisabled={!isClusterReady}
                  onClick={() => openConfirmActionModal("cleanup")}
                >
                  클라우드센터 클러스터 클린업
                </DropdownItem>

                <DropdownItem
                  isDisabled={!isClusterReady || !isCloudVmRunning}
                  onClick={openMigrationModal}
                >
                  클라우드센터VM 마이그레이션
                </DropdownItem>

                <DropdownItem onClick={openSshPortChangeModal}>
                  SSH Port 변경
                </DropdownItem>

                <DropdownItem
                  isDisabled={isClusterReady}
                  onClick={() => openConfirmActionModal("bootstrap")}
                >
                  클라우드센터 구성하기
                </DropdownItem>

                <DropdownItem
                  isDisabled={!isClusterReady}
                  onClick={() => openConfirmActionModal("connect")}
                >
                  클라우드센터 연결
                </DropdownItem>

                <DropdownItem
                  isDisabled={!isClusterReady}
                  onClick={() => openConfirmActionModal("monitoringSetup")}
                >
                  모니터링센터 구성
                </DropdownItem>

                <DropdownItem
                  isDisabled={!isClusterReady}
                  onClick={() => openConfirmActionModal("monitoringDashboard")}
                >
                  모니터링센터 대시보드 연결
                </DropdownItem>

                <DropdownItem
                  isDisabled={!isClusterReady}
                  onClick={() => openConfirmActionModal("monitoringConfigUpdate")}
                >
                  모니터링센터 수집 정보 업데이트
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
                <NetworkIcon
                  style={{ fontSize: "var(--pf-global--icon--FontSize--lg)" }}
                  aria-hidden="true"
                />
                <span>클라우드센터 클러스터 상태</span>
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
              <Label
                className="ct-health-label"
                color={statusMeta.color}
                icon={statusMeta.icon}
              >
                {statusMeta.label}
              </Label>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>노드구성</DescriptionListTerm>
            <DescriptionListDescription>{data.nodeStatus}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>리소스 상태</DescriptionListTerm>
            <DescriptionListDescription>{data.resourceStatus}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>VM실행노드</DescriptionListTerm>
            <DescriptionListDescription>{data.executionNode}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>

      <CardFooter className="ct-status-card__footer" style={{ color: footerColor }}>
        {isCollecting ? (
          <StatusLoadingMessage>{footerMessage}</StatusLoadingMessage>
        ) : footerMessage}
      </CardFooter>

      {currentConfirmAction && (
        <ConfirmActionModal
          isOpen={confirmAction !== null}
          title={currentConfirmAction.title}
          message={currentConfirmAction.message}
          confirmLabel={currentConfirmAction.confirmLabel}
          onClose={closeConfirmActionModal}
          onConfirm={confirmCloudClusterAction}
        />
      )}

      <CloudClusterMigrationModal
        isOpen={isMigrationModalOpen}
        nodes={migrationNodes}
        onClose={closeMigrationModal}
        onConfirm={confirmMigration}
      />

      <SshPortChangeModal
        isOpen={isSshPortChangeModalOpen}
        onClose={closeSshPortChangeModal}
        onConfirm={confirmSshPortChange}
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
