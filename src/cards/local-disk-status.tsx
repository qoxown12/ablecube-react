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
  CheckCircleIcon,
  EllipsisVIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  HddIcon,
  InfoCircleIcon,
} from "@patternfly/react-icons";

import {
  STATUS_LOADING_LABEL,
  STATUS_UNKNOWN_LABEL,
  StatusLoadingIcon,
  StatusLoadingMessage,
} from "./status-loading";
import LocalDiskActionModal from "./local-disk-action-modal";
import ActionProgressModal from "../components/common/ActionProgressModal";
import type { ActionProgressPhase } from "../components/common/ActionProgressModal";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import { useStatusPolling } from "../hooks/useStatusPolling";
import {
  createLocalDisk,
  fetchLocalDiskStatus,
  LOCAL_DISK_STATUS_FALLBACK,
  resetLocalDisk,
} from "../services/api/local-disk-status";
import "./status-card.scss";

const LOCAL_DISK_STATUS_META = {
  "Health OK": {
    label: "Health OK",
    color: "green",
    icon: <CheckCircleIcon />,
  },
  "Health Warn": {
    label: "Health Warn",
    color: "orange",
    icon: <ExclamationTriangleIcon />,
  },
  "Health Err": {
    label: "Health Err",
    color: "red",
    icon: <ExclamationCircleIcon />,
  },
};

type LocalDiskAction = "configure" | "reset";

const LOCAL_DISK_ACTIONS: Record<
LocalDiskAction,
{ title: string; message: string; confirmLabel: string }
> = {
  configure: {
    title: "로컬 디스크 구성",
    message: "로컬 디스크 구성을 진행하시겠습니까?",
    confirmLabel: "구성",
  },
  reset: {
    title: "로컬 디스크 초기화",
    message: "로컬 디스크를 초기화하시겠습니까?",
    confirmLabel: "초기화",
  },
};

function splitValueLines(value: string): string[] {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 0 ? lines : ["N/A"];
}

function renderValue(value: string) {
  const lines = splitValueLines(value);

  if (lines.length === 1) {
    return <span className="ct-status-card__detail-text">{lines[0]}</span>;
  }

  return (
    <Flex direction={{ default: "column" }} className="ct-status-card__detail-text">
      {lines.map((line, index) => (
        <FlexItem key={`${line}-${index}`}>{line}</FlexItem>
      ))}
    </Flex>
  );
}

export default function LocalDiskStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<LocalDiskAction | null>(null);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = React.useState(false);
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
    console.error("local disk status API error:", error);
  }, []);
  const { data, isCollecting } = useStatusPolling({
    fetcher: fetchLocalDiskStatus,
    fallback: LOCAL_DISK_STATUS_FALLBACK,
    onError: handleStatusError,
  });

  const statusMeta = isCollecting
    ? {
      label: STATUS_LOADING_LABEL,
      color: "orange",
      icon: <StatusLoadingIcon />,
    }
    : (LOCAL_DISK_STATUS_META as any)[data.status] ?? {
      label: data.status || STATUS_UNKNOWN_LABEL,
      color: "orange",
      icon: <InfoCircleIcon />,
    };
  const currentConfirmAction = confirmAction ? LOCAL_DISK_ACTIONS[confirmAction] : null;

  const onSelect = () => setIsOpen(false);

  const openConfirmActionModal = (action: LocalDiskAction) => {
    if (action === "configure") {
      setIsConfigureModalOpen(true);
      setIsOpen(false);
      return;
    }

    setConfirmAction(action);
    setIsOpen(false);
  };

  const closeConfirmActionModal = () => {
    setConfirmAction(null);
  };

  const closeConfigureModal = () => {
    setIsConfigureModalOpen(false);
  };

  const confirmLocalDiskConfigure = async (selectedIds: string[]) => {
    setIsConfigureModalOpen(false);
    setActionProgress({
      isOpen: true,
      phase: "running",
      title: "로컬 디스크 구성",
      message: "로컬 디스크 구성을 진행중입니다.",
    });

    try {
      await createLocalDisk(selectedIds);
      setActionProgress({
        isOpen: true,
        phase: "success",
        title: "로컬 디스크 구성",
        message: "로컬 디스크 구성이 완료되었습니다.",
      });
    } catch (error) {
      console.error("local disk configure API error:", error);
      setActionProgress({
        isOpen: true,
        phase: "error",
        title: "로컬 디스크 구성",
        message: error instanceof Error
          ? error.message
          : "로컬 디스크 구성 요청에 실패했습니다.",
      });
    }
  };

  const confirmLocalDiskAction = async () => {
    if (!confirmAction) return;

    const title = LOCAL_DISK_ACTIONS[confirmAction].title;
    setConfirmAction(null);
    setActionProgress({
      isOpen: true,
      phase: "running",
      title,
      message: "로컬 디스크 초기화를 진행중입니다.",
    });

    try {
      await resetLocalDisk();
      setActionProgress({
        isOpen: true,
        phase: "success",
        title,
        message: "로컬 디스크 초기화가 완료되었습니다.",
      });
    } catch (error) {
      console.error("local disk reset API error:", error);
      setActionProgress({
        isOpen: true,
        phase: "error",
        title,
        message: error instanceof Error
          ? error.message
          : "로컬 디스크 초기화 요청에 실패했습니다.",
      });
    }
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
                <DropdownItem onClick={() => openConfirmActionModal("configure")}>
                  로컬 디스크 구성
                </DropdownItem>
                <DropdownItem onClick={() => openConfirmActionModal("reset")}>
                  로컬 디스크 초기화
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
                <HddIcon
                  style={{ fontSize: "var(--pf-global--icon--FontSize--lg)" }}
                  aria-hidden="true"
                />
                <span>로컬 디스크 상태</span>
              </Flex>
            </CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody>
        <DescriptionList isCompact className="ct-status-card__dl">
          <DescriptionListGroup>
            <DescriptionListTerm>디스크 마운트 상태</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex className="ct-status-card__detail" gap={{ default: "gapSm" }}>
                <Label
                  className="ct-health-label"
                  color={statusMeta.color}
                  icon={statusMeta.icon}
                >
                  {statusMeta.label}
                </Label>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>마운트 경로</DescriptionListTerm>
            <DescriptionListDescription>{renderValue(data.mountPath)}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>물리 볼륨</DescriptionListTerm>
            <DescriptionListDescription>{renderValue(data.physicalVolume)}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>볼륨 그룹</DescriptionListTerm>
            <DescriptionListDescription>{renderValue(data.volumeGroup)}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>디스크 크기</DescriptionListTerm>
            <DescriptionListDescription>{renderValue(data.diskSize)}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>

      <CardFooter
        className="ct-status-card__footer"
        style={{ color: isCollecting ? "#f0ab00" : data.footerColor }}
      >
        {isCollecting ? (
          <StatusLoadingMessage>로컬 디스크 상태 체크 중...</StatusLoadingMessage>
        ) : data.footerMessage}
      </CardFooter>

      {currentConfirmAction && (
        <ConfirmActionModal
          isOpen={confirmAction !== null}
          title={currentConfirmAction.title}
          message={currentConfirmAction.message}
          confirmLabel={currentConfirmAction.confirmLabel}
          onClose={closeConfirmActionModal}
          onConfirm={confirmLocalDiskAction}
        />
      )}

      <LocalDiskActionModal
        isOpen={isConfigureModalOpen}
        onClose={closeConfigureModal}
        onConfirm={confirmLocalDiskConfigure}
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
