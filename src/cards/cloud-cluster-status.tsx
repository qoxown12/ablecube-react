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
import CloudClusterMigrationModal from "./cloud-cluster-migration-modal";
import SshPortChangeModal from "./ssh-port-change-modal";
import {
  STATUS_LOADING_LABEL,
  STATUS_UNKNOWN_LABEL,
  StatusLoadingMessage,
} from "./status-loading";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import { useStatusPolling } from "../hooks/useStatusPolling";
import {
  CLOUD_CLUSTER_STATUS_FALLBACK,
  fetchCloudClusterStatus,
} from "../services/api/cloud-cluster-status";
import {
  DotStatus,
  InfoGrid,
  InfoItem,
  StatusCardHeading,
} from "./status-card-layout";
import "./status-card.scss";

const CLUSTER_STATUS_META = {
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

type CloudClusterConfirmAction =
  | "start"
  | "stop"
  | "cleanup"
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
    }
    : (CLUSTER_STATUS_META as any)[data.clusterStatus] ?? {
      label: STATUS_UNKNOWN_LABEL,
      color: "orange",
    };

  const isClusterError = data.clusterStatus === "HEALTH_ERR";
  const isClusterUnknown = data.clusterStatus === "N/A" || data.clusterStatus === "";
  const footerMessage = isCollecting
    ? "클라우드센터 클러스터 상태를 확인하고 있습니다."
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

  const confirmCloudClusterAction = () => {
    if (!confirmAction) return;
    // TODO: 백엔드 API 전환 후 기존 card-cloud-cluster-status.py, create_address.py, wall 설정 호출로 연결합니다.
    console.log("cloud cluster action", confirmAction);
    setConfirmAction(null);
  };

  const openMigrationModal = () => {
    setIsMigrationModalOpen(true);
    setIsOpen(false);
  };

  const closeMigrationModal = () => {
    setIsMigrationModalOpen(false);
  };

  const confirmMigration = (targetNode: string) => {
    // TODO: 백엔드 API 전환 후 card-cloud-cluster-status.py pcsMigration --target 호출로 연결합니다.
    console.log("cloud vm migration", targetNode);
    setIsMigrationModalOpen(false);
  };

  const openSshPortChangeModal = () => {
    setIsSshPortChangeModalOpen(true);
    setIsOpen(false);
  };

  const closeSshPortChangeModal = () => {
    setIsSshPortChangeModalOpen(false);
  };

  const confirmSshPortChange = (beforePort: string, afterPort: string) => {
    // TODO: 백엔드 API 전환 후 security_patch.py --ssh-port before -P after --port-change 호출로 연결합니다.
    console.log("ssh port change", beforePort, afterPort);
    setIsSshPortChangeModalOpen(false);
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
                <DropdownGroup label="VM 제어" className="ct-status-card__menu-group">
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
                    isDisabled={!isClusterReady || !isCloudVmRunning}
                    onClick={openMigrationModal}
                  >
                    클라우드센터VM 마이그레이션
                  </DropdownItem>
                </DropdownGroup>

                <DropdownGroup label="클러스터 관리" className="ct-status-card__menu-group">
                  <DropdownItem
                    isDisabled={!isClusterReady}
                    onClick={() => openConfirmActionModal("cleanup")}
                  >
                    클라우드센터 클러스터 클린업
                  </DropdownItem>

                  <DropdownItem onClick={openSshPortChangeModal}>
                    SSH Port 변경
                  </DropdownItem>
                </DropdownGroup>

                <DropdownGroup label="모니터링" className="ct-status-card__menu-group">
                  <DropdownItem
                    isDisabled={!isClusterReady}
                    onClick={() => openConfirmActionModal("monitoringConfigUpdate")}
                  >
                    모니터링센터 수집 정보 업데이트
                  </DropdownItem>
                </DropdownGroup>
              </DropdownList>
            </Dropdown>
          ),
        }}
      >
        <CardTitle>
          <StatusCardHeading
            icon={<span className="ct-status-card__emoji" aria-hidden="true">☁</span>}
            title="클라우드센터 클러스터 상태"
            subtitle="Mold Cluster"
            tone="cloud"
          />
        </CardTitle>
      </CardHeader>

      <CardBody>
        <InfoGrid>
          <InfoItem label="클러스터 상태">
              <DotStatus tone={statusMeta.color}>
                {statusMeta.label}
              </DotStatus>
          </InfoItem>
          <InfoItem label="리소스 상태">{data.resourceStatus}</InfoItem>
          <InfoItem label="노드 구성" full mono>{data.nodeStatus}</InfoItem>
          <InfoItem label="VM 실행노드" mono>{data.executionNode}</InfoItem>
        </InfoGrid>
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
    </Card>
  );
}
