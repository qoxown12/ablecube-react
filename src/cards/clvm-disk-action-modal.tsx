// 스토리지센터 클러스터 카드의 CLVM 디스크 추가/삭제/정보 모달입니다.
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
  fetchClvmDiskList,
  type ClvmDiskInfo,
} from "../services/api/clvm-manage";
import {
  fetchGfsDiskCandidates,
  type DiskSelectionItem,
} from "../services/api/disk";

export type ClvmDiskAction = "add" | "delete" | "info";

export interface ClvmDiskActionSelection {
  selectedIds: string[];
  selectedClvmDisks: ClvmDiskInfo[];
}

interface ClvmDiskActionModalProps {
  action: ClvmDiskAction | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    action: Exclude<ClvmDiskAction, "info">,
    selection: ClvmDiskActionSelection
  ) => void;
}

type LoadStatus = "idle" | "loading" | "success" | "error";

const ACTION_TITLE: Record<ClvmDiskAction, string> = {
  add: "CLVM 디스크 추가",
  delete: "CLVM 디스크 삭제",
  info: "CLVM 디스크 정보",
};

const toggleSelection = (values: string[], value: string) => (
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
);

export default function ClvmDiskActionModal({
  action,
  isOpen,
  onClose,
  onConfirm,
}: ClvmDiskActionModalProps) {
  const [selectedAddDisks, setSelectedAddDisks] = React.useState<string[]>([]);
  const [selectedDeleteDisks, setSelectedDeleteDisks] = React.useState<string[]>([]);
  const [addableDisks, setAddableDisks] = React.useState<DiskSelectionItem[]>([]);
  const [clvmDisks, setClvmDisks] = React.useState<ClvmDiskInfo[]>([]);
  const [loadStatus, setLoadStatus] = React.useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedAddDisks([]);
      setSelectedDeleteDisks([]);
      setAddableDisks([]);
      setClvmDisks([]);
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
          setAddableDisks(disks);
          setClvmDisks([]);
        } else {
          const disks = await fetchClvmDiskList();

          if (!isCurrent) return;
          setClvmDisks(disks);
          setAddableDisks([]);
        }

        setLoadStatus("success");
      } catch (error) {
        if (!isCurrent) return;

        console.error("clvm disk modal data API error:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "CLVM 디스크 데이터를 조회하지 못했습니다."
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

  const isAdd = action === "add";
  const isDelete = action === "delete";
  const selectedIds = isAdd ? selectedAddDisks : selectedDeleteDisks;
  const isExecutable =
    loadStatus === "success" &&
    (action === "info" || selectedIds.length > 0);
  const modalSizeClass = isAdd ? "ct-clvm-disk-modal--large" : "ct-clvm-disk-modal--medium";

  const execute = () => {
    if (action === "info") {
      onClose();
      return;
    }

    onConfirm(action, {
      selectedIds,
      selectedClvmDisks: clvmDisks.filter((disk) => selectedIds.includes(disk.id)),
    });
  };

  const renderLoadState = () => {
    if (loadStatus === "loading") {
      return (
        <div className="ct-wwn-list-modal__loading">
          <Spinner size="sm" aria-label="CLVM 디스크 데이터 조회 중" />
          <Content component="p">CLVM 디스크 데이터를 조회중입니다.</Content>
        </div>
      );
    }

    if (loadStatus === "error") {
      return (
        <Alert isInline variant="danger" title="CLVM 디스크 데이터 조회 실패">
          {errorMessage}
        </Alert>
      );
    }

    return null;
  };

  const renderAddBody = () => (
    <>
      <div className="ct-clvm-disk-modal__warning">
        <ExclamationTriangleIcon aria-hidden="true" />
        <span>여러 디스크를 선택하면, 각 디스크에 대해 순차적으로 볼륨 그룹이 자동 생성됩니다.</span>
      </div>
      <div className="ct-clvm-disk-modal__field">
        <div className="ct-clvm-disk-modal__field-label">
          CLVM 디스크 구성 대상 장치 <span aria-hidden="true">*</span>
        </div>
        <div className="ct-clvm-disk-modal__scroll-list">
          {addableDisks.length > 0 ? addableDisks.map((disk) => (
            <label className="ct-clvm-disk-modal__check" key={disk.id}>
              <input
                type="checkbox"
                checked={selectedAddDisks.includes(disk.value)}
                disabled={disk.disabled}
                onChange={() => setSelectedAddDisks((values) => toggleSelection(values, disk.value))}
              />
              <span>{disk.label}</span>
            </label>
          )) : (
            <Content component="p">데이터가 존재하지 않습니다.</Content>
          )}
        </div>
      </div>
    </>
  );

  const renderDeleteBody = () => (
    <div className="ct-clvm-disk-modal__scroll-list ct-clvm-disk-modal__mono">
      {clvmDisks.length > 0 ? clvmDisks.map((disk) => (
        <label className="ct-clvm-disk-modal__check" key={disk.id}>
          <input
            type="checkbox"
            checked={selectedDeleteDisks.includes(disk.id)}
            onChange={() => setSelectedDeleteDisks((values) => toggleSelection(values, disk.id))}
          />
          <span>{disk.label}</span>
        </label>
      )) : (
        <Content component="p">데이터가 존재하지 않습니다.</Content>
      )}
    </div>
  );

  const renderInfoBody = () => (
    <div className="ct-clvm-disk-modal__scroll-list ct-clvm-disk-modal__mono">
      {clvmDisks.length > 0 ? clvmDisks.map((disk) => (
        <div key={disk.id}>{disk.label}</div>
      )) : (
        <Content component="p">데이터가 존재하지 않습니다.</Content>
      )}
    </div>
  );

  const loadState = renderLoadState();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant={isAdd ? "large" : "medium"}
      aria-label={ACTION_TITLE[action]}
      className={`ct-clvm-disk-modal ${modalSizeClass}`}
    >
      <ModalHeader title={ACTION_TITLE[action]} />
      <ModalBody>
        {loadState ?? (
          <>
            {isAdd && renderAddBody()}
            {isDelete && renderDeleteBody()}
            {action === "info" && renderInfoBody()}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" isDisabled={!isExecutable} onClick={execute}>
          {isAdd ? "추가" : "확인"}
        </Button>
        {action !== "info" && (
          <Button variant="link" onClick={onClose}>
            취소
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
