// GFS 디스크 추가/삭제/확장/상세정보 모달입니다.
import React from "react";
import {
  Alert,
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@patternfly/react-core";
import { ExclamationTriangleIcon } from "@patternfly/react-icons";

import {
  fetchGfsDiskStatus,
  type GfsDiskMountInfo,
} from "../services/api/gfs-disk-status";
import {
  fetchGfsDiskCandidates,
  type DiskSelectionItem,
} from "../services/api/disk";

export type GfsDiskAction = "add" | "delete" | "extend" | "info";
export type GfsExtendMethod = "resize" | "add-lun";

export interface GfsDiskActionSelection {
  selectedIds: string[];
  selectedGfsDisks: GfsDiskMountInfo[];
  selectedCandidateIds: string[];
  extendMethod: GfsExtendMethod;
  isNoDowntime: boolean;
}

interface GfsDiskActionModalProps {
  action: GfsDiskAction | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    action: Exclude<GfsDiskAction, "info">,
    selection: GfsDiskActionSelection
  ) => void;
}

type LoadStatus = "idle" | "loading" | "success" | "error";

const ACTION_TITLE: Record<GfsDiskAction, string> = {
  add: "GFS 디스크 추가",
  delete: "GFS 디스크 삭제",
  extend: "GFS 디스크 확장",
  info: "디스크 상세 정보",
};

const toggleSelection = (values: string[], value: string) => (
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
);

const singleSelection = (values: string[], value: string) => (
  values.includes(value) ? [] : [value]
);

function gfsDiskLabel(disk: GfsDiskMountInfo): string {
  return [
    disk.mountPath,
    disk.multipaths,
    disk.diskSize,
  ].filter(Boolean).join(" ");
}

export default function GfsDiskActionModal({
  action,
  isOpen,
  onClose,
  onConfirm,
}: GfsDiskActionModalProps) {
  const [selectedCandidateIds, setSelectedCandidateIds] = React.useState<string[]>([]);
  const [selectedGfsIds, setSelectedGfsIds] = React.useState<string[]>([]);
  const [extendMethod, setExtendMethod] = React.useState<GfsExtendMethod>("resize");
  const [isNoDowntime, setIsNoDowntime] = React.useState(false);
  const [candidateDisks, setCandidateDisks] = React.useState<DiskSelectionItem[]>([]);
  const [gfsDisks, setGfsDisks] = React.useState<GfsDiskMountInfo[]>([]);
  const [loadStatus, setLoadStatus] = React.useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedCandidateIds([]);
      setSelectedGfsIds([]);
      setExtendMethod("resize");
      setIsNoDowntime(false);
      setCandidateDisks([]);
      setGfsDisks([]);
      setLoadStatus("idle");
      setErrorMessage("");
      return undefined;
    }

    if (!action) {
      return undefined;
    }

    let isCurrent = true;

    const loadData = async () => {
      setLoadStatus("loading");
      setErrorMessage("");

      try {
        if (action === "add") {
          const disks = await fetchGfsDiskCandidates();

          if (!isCurrent) return;
          setCandidateDisks(disks);
          setGfsDisks([]);
        } else if (action === "extend") {
          const [status, candidates] = await Promise.all([
            fetchGfsDiskStatus(),
            fetchGfsDiskCandidates(),
          ]);

          if (!isCurrent) return;
          setGfsDisks(status.mountDetails);
          setCandidateDisks(candidates);
        } else {
          const status = await fetchGfsDiskStatus();

          if (!isCurrent) return;
          setGfsDisks(status.mountDetails);
          setCandidateDisks([]);
        }

        setLoadStatus("success");
      } catch (error) {
        if (!isCurrent) return;

        console.error("gfs disk modal data API error:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "GFS 디스크 데이터를 조회하지 못했습니다."
        );
        setLoadStatus("error");
      }
    };

    void loadData();

    return () => {
      isCurrent = false;
    };
  }, [action, isOpen]);

  if (!action) {
    return null;
  }

  const isInfo = action === "info";
  const isAdd = action === "add";
  const isExtend = action === "extend";
  const needsAddLunSelection = isExtend && extendMethod === "add-lun";
  const isExecutable =
    loadStatus === "success" &&
    (
      isInfo ||
      (isAdd && selectedCandidateIds.length > 0) ||
      (action === "delete" && selectedGfsIds.length > 0) ||
      (
        isExtend &&
        selectedGfsIds.length > 0 &&
        (!needsAddLunSelection || selectedCandidateIds.length > 0)
      )
    );

  const execute = () => {
    if (isInfo) {
      onClose();
      return;
    }

    const selectedGfsDisks = gfsDisks.filter((disk) => selectedGfsIds.includes(disk.id));

    onConfirm(action, {
      selectedIds: [...selectedGfsIds, ...selectedCandidateIds],
      selectedGfsDisks,
      selectedCandidateIds,
      extendMethod,
      isNoDowntime,
    });
  };

  const renderLoadState = () => {
    if (loadStatus === "loading") {
      return (
        <div className="ct-wwn-list-modal__loading">
          <Spinner size="sm" aria-label="GFS 디스크 데이터 조회 중" />
          <Content component="p">GFS 디스크 데이터를 조회중입니다.</Content>
        </div>
      );
    }

    if (loadStatus === "error") {
      return (
        <Alert isInline variant="danger" title="GFS 디스크 데이터 조회 실패">
          {errorMessage}
        </Alert>
      );
    }

    return null;
  };

  const renderCandidateChecks = () => (
    <div className="ct-clvm-disk-modal__scroll-list ct-clvm-disk-modal__mono">
      {candidateDisks.length > 0 ? candidateDisks.map((disk) => (
        <label className="ct-clvm-disk-modal__check" key={disk.id}>
          <input
            type="checkbox"
            checked={selectedCandidateIds.includes(disk.value)}
            disabled={disk.disabled}
            onChange={() => setSelectedCandidateIds((values) => toggleSelection(values, disk.value))}
          />
          <span>{disk.label}</span>
        </label>
      )) : (
        <Content component="p">데이터가 존재하지 않습니다.</Content>
      )}
    </div>
  );

  const renderGfsChecks = () => (
    <div className="ct-clvm-disk-modal__scroll-list ct-clvm-disk-modal__mono">
      {gfsDisks.length > 0 ? gfsDisks.map((disk) => (
        <label className="ct-clvm-disk-modal__check" key={disk.id}>
          <input
            type="checkbox"
            checked={selectedGfsIds.includes(disk.id)}
            onChange={() => setSelectedGfsIds((values) => singleSelection(values, disk.id))}
          />
          <span>{gfsDiskLabel(disk)}</span>
        </label>
      )) : (
        <Content component="p">데이터가 존재하지 않습니다.</Content>
      )}
    </div>
  );

  const renderInfo = () => (
    <div className="ct-action-confirm-modal__body">
      {gfsDisks.length > 0 ? gfsDisks.map((disk) => (
        <div className="ct-gfs-disk-info" key={disk.id}>
          <div><strong>디스크 마운트 상태</strong> {disk.status}</div>
          <div><strong>마운트 경로</strong> {disk.mountPath}</div>
          <div><strong>물리 볼륨</strong> {disk.physicalVolume}</div>
          <div><strong>볼륨 그룹</strong> {disk.volumeGroup}</div>
          <div><strong>디스크 크기</strong> {disk.diskSize}</div>
          <div><strong>리소스 상태</strong> {disk.resourceStatus.join(" / ")}</div>
        </div>
      )) : (
        <Content component="p">데이터가 존재하지 않습니다.</Content>
      )}
    </div>
  );

  const renderExtendBody = () => (
    <div className="ct-action-confirm-modal__body">
      <Content component="p">확장할 GFS 디스크 및 확장 방식을 선택해주세요.</Content>
      {renderGfsChecks()}
      <label className="ct-action-confirm-modal__check">
        <input
          type="radio"
          name="gfs-extend-method"
          checked={extendMethod === "resize"}
          onChange={() => setExtendMethod("resize")}
        />
        <span>기존 디스크 사이즈만 확장</span>
      </label>
      <label className="ct-action-confirm-modal__check">
        <input
          type="radio"
          name="gfs-extend-method"
          checked={extendMethod === "add-lun"}
          onChange={() => setExtendMethod("add-lun")}
        />
        <span>새로운 LUN 디스크 추가</span>
      </label>
      {needsAddLunSelection ? renderCandidateChecks() : null}
      <label className="ct-action-confirm-modal__check">
        <input
          type="checkbox"
          checked={isNoDowntime}
          onChange={(event) => setIsNoDowntime(event.currentTarget.checked)}
        />
        <span>무중단 확장</span>
      </label>
    </div>
  );

  const loadState = renderLoadState();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant={isAdd ? "large" : "medium"}
      aria-label={ACTION_TITLE[action]}
      className={`ct-clvm-disk-modal ${isAdd ? "ct-clvm-disk-modal--large" : "ct-clvm-disk-modal--medium"}`}
    >
      <ModalHeader title={ACTION_TITLE[action]} />
      <ModalBody>
        {loadState ?? (
          <>
            {isAdd && (
              <>
                <div className="ct-clvm-disk-modal__warning">
                  <ExclamationTriangleIcon aria-hidden="true" />
                  <span>선택한 항목과 관계없이 한 번에 하나의 디스크만 생성됩니다. 원하는 디스크를 신중하게 선택하세요.</span>
                </div>
                {renderCandidateChecks()}
              </>
            )}
            {action === "delete" && (
              <>
                <div className="ct-clvm-disk-modal__warning">
                  <ExclamationTriangleIcon aria-hidden="true" />
                  <span>선택한 디스크의 모든 데이터가 영구적으로 삭제됩니다.</span>
                </div>
                {renderGfsChecks()}
              </>
            )}
            {isExtend && renderExtendBody()}
            {isInfo && renderInfo()}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" isDisabled={!isExecutable} onClick={execute}>
          {isAdd ? "추가" : action === "delete" ? "삭제" : isExtend ? "확장" : "확인"}
        </Button>
        {!isInfo && (
          <Button variant="link" onClick={onClose}>
            취소
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
