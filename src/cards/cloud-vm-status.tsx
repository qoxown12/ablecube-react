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
  VirtualMachineIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  EllipsisVIcon,
} from "@patternfly/react-icons";

import {
  STATUS_LOADING_LABEL,
  STATUS_UNKNOWN_LABEL,
  StatusLoadingIcon,
  StatusLoadingMessage,
} from "./status-loading";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import SelectActionModal from "../components/common/SelectActionModal";
import TextInputConfirmModal from "../components/common/TextInputConfirmModal";
import VmResourceUpdateModal from "../components/common/VmResourceUpdateModal";
import ActionProgressModal from "../components/common/ActionProgressModal";
import type { ActionProgressPhase } from "../components/common/ActionProgressModal";
import { useStatusPolling } from "../hooks/useStatusPolling";
import {
  CLOUD_VM_STATUS_FALLBACK,
  controlCloudVmService,
  createCloudVmSnapshotBackup,
  fetchCloudVmSnapshotOptions,
  fetchCloudVmStatus,
  resizeCloudVmSecondaryDisk,
  rollbackCloudVmSnapshot,
  runCloudVmInstantDbBackup,
  updateCloudVmResource,
} from "../services/api/cloud-vm-status";
import "./status-card.scss";

const VM_STATUS_META = {
  running: {
    label: "Running",
    color: "green",
    icon: <CheckCircleIcon />,
  },
  shutOff: {
    label: "Stopped",
    color: "orange",
    icon: <ExclamationTriangleIcon />,
  },
  HEALTH_ERR: {
    label: "Health Err",
    color: "red",
    icon: <ExclamationCircleIcon />,
  },
};

type CloudVmConfirmAction = "snapshotBackup";

type CloudVmSelectAction =
  | "moldService"
  | "moldDb"
  | "snapshotRollback"
  | "dbBackup";

const CLOUD_VM_CONFIRM_ACTIONS: Record<CloudVmConfirmAction, { title: string; message: string; confirmLabel?: string }> = {
  snapshotBackup: {
    title: "클라우드센터VM 스냅샷 백업",
    message: "클라우드센터VM 백업용 스냅샷을 생성하시겠습니까?",
  },
};

const CLOUD_VM_SELECT_ACTIONS: Record<
CloudVmSelectAction,
{ title: string; message: string; selectLabel: string; options: { value: string; label: string }[]; warning?: string }
> = {
  moldService: {
    title: "Mold 서비스 제어",
    message: "Mold 서비스 제어 명령을 선택해주세요.",
    selectLabel: "제어 명령",
    options: [
      { value: "start", label: "시작" },
      { value: "restart", label: "재시작" },
      { value: "stop", label: "정지" },
    ],
  },
  moldDb: {
    title: "Mold DB 제어",
    message: "Mold DB 제어 명령을 선택해주세요.",
    selectLabel: "제어 명령",
    options: [
      { value: "start", label: "시작" },
      { value: "restart", label: "재시작" },
      { value: "stop", label: "정지" },
    ],
  },
  snapshotRollback: {
    title: "클라우드센터VM 스냅샷 복구",
    message: "복구할 스냅샷을 선택해주세요.",
    selectLabel: "스냅샷 목록",
    options: [],
    warning: "스냅샷 복구 후에는 현재 상태로 돌아갈 수 없습니다.",
  },
  dbBackup: {
    title: "DB 백업",
    message: "DB 백업 작업을 선택해주세요.",
    selectLabel: "백업 작업",
    options: [
      { value: "instantBackup", label: "즉시 백업" },
      { value: "regularBackup", label: "정기 백업" },
      { value: "deleteOldBackup", label: "백업파일 삭제관리" },
    ],
  },
};

export default function CloudVmStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<CloudVmConfirmAction | null>(null);
  const [selectAction, setSelectAction] = React.useState<CloudVmSelectAction | null>(null);
  const [isResourceUpdateModalOpen, setIsResourceUpdateModalOpen] = React.useState(false);
  const [isSecondarySizeModalOpen, setIsSecondarySizeModalOpen] = React.useState(false);
  const [snapshotOptions, setSnapshotOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [isSnapshotOptionsLoading, setIsSnapshotOptionsLoading] = React.useState(false);
  const [snapshotOptionsError, setSnapshotOptionsError] = React.useState("");
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
    console.error("cloud vm status API error:", error);
  }, []);
  const { data, isCollecting } = useStatusPolling({
    fetcher: fetchCloudVmStatus,
    fallback: CLOUD_VM_STATUS_FALLBACK,
    onError: handleStatusError,
  });

  const statusMeta = isCollecting
    ? {
      label: STATUS_LOADING_LABEL,
      color: "orange",
      icon: <StatusLoadingIcon />,
    }
    : (VM_STATUS_META as any)[data.vmStatus] ?? {
      label: STATUS_UNKNOWN_LABEL,
      color: "orange",
      icon: <InfoCircleIcon />,
    };

  const isVmError = data.vmStatus === "HEALTH_ERR";
  const isVmUnknown = data.vmStatus === "N/A" || data.vmStatus === "";
  const footerMessage = isCollecting
    ? "클라우드센터 가상머신 상태 체크 중..."
    : isVmUnknown
    ? "클라우드센터 가상머신 상태 정보를 확인할 수 없습니다."
    : isVmError
      ? "클라우드센터 가상머신이 배포되지 않았습니다."
      : "클라우드센터 가상머신이 배포되었습니다.";
  const footerColor = isCollecting ? "#f0ab00" : isVmUnknown ? "#f0ab00" : isVmError ? "#c9190b" : "#3e8635";
  const isVmRunning = data.vmStatus === "running";
  const currentConfirmAction = confirmAction ? CLOUD_VM_CONFIRM_ACTIONS[confirmAction] : null;
  const currentSelectAction = selectAction ? CLOUD_VM_SELECT_ACTIONS[selectAction] : null;
  const currentSelectOptions = selectAction === "snapshotRollback"
    ? snapshotOptions
    : currentSelectAction?.options ?? [];

  const onSelect = () => setIsOpen(false);

  const openConfirmActionModal = (action: CloudVmConfirmAction) => {
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

  const confirmCloudVmAction = () => {
    if (!confirmAction) return;

    setConfirmAction(null);
    void runProgressAction(
      "클라우드센터VM 스냅샷 백업",
      "클라우드센터VM 스냅샷 백업을 진행중입니다.",
      "클라우드센터VM 스냅샷 백업이 완료되었습니다.",
      "클라우드센터VM 스냅샷 백업에 실패했습니다.",
      createCloudVmSnapshotBackup
    );
  };

  const loadSnapshotOptions = async () => {
    setIsSnapshotOptionsLoading(true);
    setSnapshotOptionsError("");
    setSnapshotOptions([]);

    try {
      const options = await fetchCloudVmSnapshotOptions();
      setSnapshotOptions(options);
    } catch (error) {
      console.error("cloud vm snapshot list API error:", error);
      setSnapshotOptionsError(
        error instanceof Error
          ? error.message
          : "클라우드센터VM 스냅샷 목록 조회에 실패했습니다."
      );
    } finally {
      setIsSnapshotOptionsLoading(false);
    }
  };

  const openSelectActionModal = (action: CloudVmSelectAction) => {
    setSelectAction(action);
    setIsOpen(false);

    if (action === "snapshotRollback") {
      void loadSnapshotOptions();
    }
  };

  const closeSelectActionModal = () => {
    setSelectAction(null);
  };

  const confirmCloudVmSelectAction = (value: string) => {
    if (!selectAction) return;

    const action = selectAction;
    setSelectAction(null);

    if (action === "moldService") {
      void runProgressAction(
        "Mold 서비스 제어",
        "Mold 서비스 제어를 진행중입니다.",
        "Mold 서비스 제어가 완료되었습니다.",
        "Mold 서비스 제어에 실패했습니다.",
        () => controlCloudVmService("mold.service", value)
      );
      return;
    }

    if (action === "moldDb") {
      void runProgressAction(
        "Mold DB 제어",
        "Mold DB 제어를 진행중입니다.",
        "Mold DB 제어가 완료되었습니다.",
        "Mold DB 제어에 실패했습니다.",
        () => controlCloudVmService("mysqld", value)
      );
      return;
    }

    if (action === "snapshotRollback") {
      void runProgressAction(
        "클라우드센터VM 스냅샷 복구",
        "클라우드센터VM 스냅샷 복구를 진행중입니다.",
        "클라우드센터VM 스냅샷 복구가 완료되었습니다.",
        "클라우드센터VM 스냅샷 복구에 실패했습니다.",
        () => rollbackCloudVmSnapshot(value)
      );
      return;
    }

    if (value !== "instantBackup") {
      setActionProgress({
        isOpen: true,
        phase: "error",
        title: "DB 백업",
        message: "정기 백업과 백업파일 삭제 관리는 반복 주기, 시간, 보관 기간 입력 화면이 필요해 후속 이관 대상으로 남겨두었습니다.",
      });
      return;
    }

    void runProgressAction(
      "DB 즉시 백업",
      "DB 즉시 백업을 진행중입니다.",
      "DB 즉시 백업이 완료되었습니다.",
      "DB 즉시 백업에 실패했습니다.",
      runCloudVmInstantDbBackup
    );
  };

  const openResourceUpdateModal = () => {
    setIsResourceUpdateModalOpen(true);
    setIsOpen(false);
  };

  const closeResourceUpdateModal = () => {
    setIsResourceUpdateModalOpen(false);
  };

  const confirmResourceUpdate = (cpu: string, memory: string) => {
    setIsResourceUpdateModalOpen(false);

    void runProgressAction(
      "클라우드센터VM 자원변경",
      "클라우드센터VM 자원변경을 진행중입니다.",
      "클라우드센터VM 자원변경이 완료되었습니다.",
      "클라우드센터VM 자원변경에 실패했습니다.",
      () => updateCloudVmResource(cpu, memory)
    );
  };

  const openSecondarySizeModal = () => {
    setIsSecondarySizeModalOpen(true);
    setIsOpen(false);
  };

  const closeSecondarySizeModal = () => {
    setIsSecondarySizeModalOpen(false);
  };

  const confirmSecondarySize = (size: string) => {
    const sizeGiB = Number(size);

    setIsSecondarySizeModalOpen(false);

    if (!Number.isInteger(sizeGiB) || sizeGiB < 1 || sizeGiB > 500) {
      setActionProgress({
        isOpen: true,
        phase: "error",
        title: "Mold 세컨더리 용량 추가",
        message: "추가 용량은 1 이상 500 이하의 정수 GiB로 입력해주세요.",
      });
      return;
    }

    void runProgressAction(
      "Mold 세컨더리 용량 추가",
      "Mold 세컨더리 용량 추가를 진행중입니다.",
      "Mold 세컨더리 용량 추가가 완료되었습니다.",
      "Mold 세컨더리 용량 추가에 실패했습니다.",
      () => resizeCloudVmSecondaryDisk(sizeGiB)
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
                  isDisabled={isVmRunning}
                  onClick={openResourceUpdateModal}
                >
                  클라우드센터VM 자원변경
                </DropdownItem>
                <DropdownItem
                  isDisabled={!isVmRunning}
                  onClick={() => openSelectActionModal("moldService")}
                >
                  Mold 서비스 제어
                </DropdownItem>
                <DropdownItem
                  isDisabled={!isVmRunning}
                  onClick={() => openSelectActionModal("moldDb")}
                >
                  Mold DB 제어
                </DropdownItem>
                <DropdownItem
                  isDisabled={!isVmRunning}
                  onClick={openSecondarySizeModal}
                >
                  Mold 세컨더리 용량 추가
                </DropdownItem>
                <DropdownItem onClick={() => openConfirmActionModal("snapshotBackup")}>
                  스냅샷 백업
                </DropdownItem>
                <DropdownItem
                  isDisabled={isVmRunning}
                  onClick={() => openSelectActionModal("snapshotRollback")}
                >
                  스냅샷 복구
                </DropdownItem>
                <DropdownItem
                  isDisabled={!isVmRunning}
                  onClick={() => openSelectActionModal("dbBackup")}
                >
                  DB 백업
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
                <VirtualMachineIcon
                  style={{ fontSize: "var(--pf-global--icon--FontSize--lg)" }}
                  aria-hidden="true"
                />
                <span>클라우드센터 가상머신 상태</span>
              </Flex>
            </CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody>
        <DescriptionList isCompact className="ct-status-card__dl">
          <DescriptionListGroup>
            <DescriptionListTerm>가상머신 상태</DescriptionListTerm>
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
            <DescriptionListTerm>Mold 서비스 상태</DescriptionListTerm>
            <DescriptionListDescription>{data.moldServiceStatus}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Mold DB 상태</DescriptionListTerm>
            <DescriptionListDescription>{data.moldDbStatus}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>CPU</DescriptionListTerm>
            <DescriptionListDescription>{data.cpu}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Memory</DescriptionListTerm>
            <DescriptionListDescription>{data.memory}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>ROOT Disk 크기</DescriptionListTerm>
            <DescriptionListDescription>{data.rootDiskSize}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>세컨더리 Disk 크기</DescriptionListTerm>
            <DescriptionListDescription>{data.secondaryDiskSize}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm className="pf-v5-u-align-self-flex-start">관리 NIC</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex direction={{ default: "column" }}>
                <FlexItem>{data.manageNicType}</FlexItem>
                <FlexItem>{data.manageNicIp}</FlexItem>
                <FlexItem>{data.manageNicPrefix}</FlexItem>
                <FlexItem>{data.manageNicGw}</FlexItem>
                <FlexItem>{data.manageNicDns}</FlexItem>
              </Flex>
            </DescriptionListDescription>
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
          onConfirm={confirmCloudVmAction}
        />
      )}

      {currentSelectAction && (
        <SelectActionModal
          isOpen={selectAction !== null}
          title={currentSelectAction.title}
          message={currentSelectAction.message}
          selectLabel={currentSelectAction.selectLabel}
          options={currentSelectOptions}
          warning={currentSelectAction.warning}
          isLoading={selectAction === "snapshotRollback" && isSnapshotOptionsLoading}
          errorMessage={selectAction === "snapshotRollback" ? snapshotOptionsError : ""}
          emptyMessage="조회된 스냅샷이 없습니다."
          onClose={closeSelectActionModal}
          onConfirm={confirmCloudVmSelectAction}
        />
      )}

      <VmResourceUpdateModal
        isOpen={isResourceUpdateModalOpen}
        title="클라우드센터VM 자원변경"
        cpuOptions={["2", "4", "8", "16"]}
        memoryOptions={["4", "8", "16", "32", "64"]}
        onClose={closeResourceUpdateModal}
        onConfirm={confirmResourceUpdate}
      />

      <TextInputConfirmModal
        isOpen={isSecondarySizeModalOpen}
        title="Mold 세컨더리 용량 추가"
        message="추가 확장할 용량을 입력해 주세요. (1회 최대 500GiB)"
        inputLabel="추가 용량"
        placeholder="예: 100"
        warning="용량 추가 작업시 클라우드센터 가상머신 스냅샷이 모두 삭제되고, 클라우드센터 가상머신을 재시작합니다."
        checkLabel="Mold 세컨더리 용량 추가 확인"
        onClose={closeSecondarySizeModal}
        onConfirm={confirmSecondarySize}
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
