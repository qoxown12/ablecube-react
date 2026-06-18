import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
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
import { EllipsisVIcon, StorageDomainIcon } from "@patternfly/react-icons";

import ClvmDiskActionModal from "./clvm-disk-action-modal";
import type { ClvmDiskAction, ClvmDiskActionSelection } from "./clvm-disk-action-modal";
import GfsDiskActionModal from "./gfs-disk-action-modal";
import type { GfsDiskAction, GfsDiskActionSelection } from "./gfs-disk-action-modal";
import GfsMountInfoModal from "./gfs-mount-info-modal";
import type { GfsMountInfo } from "./gfs-mount-info-modal";
import { StatusLoadingMessage } from "./status-loading";
import ActionProgressModal from "../components/common/ActionProgressModal";
import type { ActionProgressPhase } from "../components/common/ActionProgressModal";
import { useStatusPolling } from "../hooks/useStatusPolling";
import {
  createClvmDisks,
  deleteClvmDisks,
} from "../services/api/clvm-manage";
import {
  addExtendGfsDisk,
  deleteGfsDisk,
  extendGfsDisk,
} from "../services/api/gfs-manage";
import {
  fetchGfsDiskStatus,
  GFS_DISK_STATUS_FALLBACK,
} from "../services/api/gfs-disk-status";
import "./status-card.scss";

export default function GfsDiskStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [gfsDiskAction, setGfsDiskAction] = React.useState<GfsDiskAction | null>(null);
  const [clvmDiskAction, setClvmDiskAction] = React.useState<ClvmDiskAction | null>(null);
  const [selectedMountInfo, setSelectedMountInfo] = React.useState<GfsMountInfo | null>(null);
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
        id: data.mountPath,
        mountPath: data.mountPath,
        status: "N/A",
        devices: "N/A",
        deviceList: [],
        multipaths: "N/A",
        multipathList: [],
        physicalVolume: "N/A",
        volumeGroup: "N/A",
        diskSize: "N/A",
        diskIds: [],
        lvm: "N/A",
        vgName: "N/A",
        lvName: "N/A",
        gfsName: "N/A",
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

  const confirmGfsDiskAction = (
    action: Exclude<GfsDiskAction, "info">,
    selection: GfsDiskActionSelection
  ) => {
    setGfsDiskAction(null);

    if (action === "add") {
      setActionProgress({
        isOpen: true,
        phase: "error",
        title: "GFS 디스크 추가",
        message: "GFS 디스크 추가 전용 API가 아직 확인되지 않았습니다. 기존 GFS 확장은 'GFS 디스크 확장'에서 새 LUN 디스크 추가를 사용해주세요.",
      });
      return;
    }

    const selectedGfsDisk = selection.selectedGfsDisks[0];

    if (!selectedGfsDisk) {
      setActionProgress({
        isOpen: true,
        phase: "error",
        title: action === "delete" ? "GFS 디스크 삭제" : "GFS 디스크 확장",
        message: "선택한 GFS 디스크 정보를 확인할 수 없습니다.",
      });
      return;
    }

    if (action === "delete") {
      void runProgressAction(
        "GFS 디스크 삭제",
        "GFS 디스크 삭제를 진행중입니다.",
        "GFS 디스크 삭제가 완료되었습니다.",
        "GFS 디스크 삭제에 실패했습니다.",
        () => deleteGfsDisk(selectedGfsDisk)
      );
      return;
    }

    void runProgressAction(
      "GFS 디스크 확장",
      "GFS 디스크 확장을 진행중입니다.",
      "GFS 디스크 확장이 완료되었습니다.",
      "GFS 디스크 확장에 실패했습니다.",
      () => selection.extendMethod === "add-lun"
        ? addExtendGfsDisk(
          selectedGfsDisk,
          selection.selectedCandidateIds,
          selection.isNoDowntime
        )
        : extendGfsDisk(selectedGfsDisk, selection.isNoDowntime)
    );
  };

  const openClvmDiskActionModal = (action: ClvmDiskAction) => {
    setClvmDiskAction(action);
    setIsOpen(false);
  };

  const closeClvmDiskActionModal = () => {
    setClvmDiskAction(null);
  };

  const confirmClvmDiskAction = (
    action: Exclude<ClvmDiskAction, "info">,
    selection: ClvmDiskActionSelection
  ) => {
    setClvmDiskAction(null);

    const title = action === "add" ? "CLVM 디스크 추가" : "CLVM 디스크 삭제";

    void runProgressAction(
      title,
      `${title}를 진행중입니다.`,
      `${title}가 완료되었습니다.`,
      `${title}에 실패했습니다.`,
      () => action === "add"
        ? createClvmDisks(selection.selectedIds)
        : deleteClvmDisks(selection.selectedClvmDisks)
    );
  };

  const openMountInfoModal = (mountInfo: GfsMountInfo) => {
    setSelectedMountInfo(mountInfo);
  };

  const closeMountInfoModal = () => {
    setSelectedMountInfo(null);
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
                <DropdownItem onClick={() => openGfsDiskActionModal("add")}>
                  GFS 디스크 추가
                </DropdownItem>
                <DropdownItem onClick={() => openGfsDiskActionModal("delete")}>
                  GFS 디스크 삭제
                </DropdownItem>
                <DropdownItem onClick={() => openGfsDiskActionModal("extend")}>
                  GFS 디스크 확장
                </DropdownItem>
                <DropdownItem onClick={() => openClvmDiskActionModal("add")}>
                  CLVM 디스크 추가
                </DropdownItem>
                <DropdownItem onClick={() => openClvmDiskActionModal("delete")}>
                  CLVM 디스크 삭제
                </DropdownItem>
                <DropdownItem onClick={() => openClvmDiskActionModal("info")}>
                  CLVM 디스크 정보
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
                <StorageDomainIcon
                  style={{ fontSize: "var(--pf-global--icon--FontSize--lg)" }}
                  aria-hidden="true"
                />
                <span>GFS 디스크 상태</span>
              </Flex>
            </CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody>
        <DescriptionList isCompact className="ct-status-card__dl">
          <DescriptionListGroup>
            <DescriptionListTerm>모드</DescriptionListTerm>
            <DescriptionListDescription>{data.mode}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>마운트 경로</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                {mountDetails.length > 0 ? mountDetails.map((mountInfo, index) => (
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
          <StatusLoadingMessage>GFS 디스크 상태 체크 중...</StatusLoadingMessage>
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
