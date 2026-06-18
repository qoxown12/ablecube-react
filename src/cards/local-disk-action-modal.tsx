// 단일 서버 구성의 로컬 디스크 구성 대상 장치 선택 모달입니다.
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
  fetchGfsDiskCandidates,
  type DiskSelectionItem,
} from "../services/api/disk";

interface LocalDiskActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
}

type LoadStatus = "idle" | "loading" | "success" | "error";

const toggleSelection = (values: string[], value: string) => (
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
);

export default function LocalDiskActionModal({
  isOpen,
  onClose,
  onConfirm,
}: LocalDiskActionModalProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [disks, setDisks] = React.useState<DiskSelectionItem[]>([]);
  const [loadStatus, setLoadStatus] = React.useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setDisks([]);
      setLoadStatus("idle");
      setErrorMessage("");
      return undefined;
    }

    let isCurrent = true;

    const loadData = async () => {
      setLoadStatus("loading");
      setErrorMessage("");

      try {
        const nextDisks = await fetchGfsDiskCandidates();

        if (!isCurrent) return;
        setDisks(nextDisks);
        setLoadStatus("success");
      } catch (error) {
        if (!isCurrent) return;

        console.error("local disk list API error:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "로컬 디스크 후보 목록을 조회하지 못했습니다."
        );
        setLoadStatus("error");
      }
    };

    void loadData();

    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  const renderBody = () => {
    if (loadStatus === "loading") {
      return (
        <div className="ct-wwn-list-modal__loading">
          <Spinner size="sm" aria-label="로컬 디스크 후보 조회 중" />
          <Content component="p">로컬 디스크 후보 목록을 조회중입니다.</Content>
        </div>
      );
    }

    if (loadStatus === "error") {
      return (
        <Alert isInline variant="danger" title="로컬 디스크 후보 조회 실패">
          {errorMessage}
        </Alert>
      );
    }

    return (
      <div className="ct-action-confirm-modal__body">
        <div className="ct-clvm-disk-modal__warning">
          <ExclamationTriangleIcon aria-hidden="true" />
          <span>선택한 디스크는 로컬 스토리지 구성에 사용되며 기존 데이터가 삭제될 수 있습니다.</span>
        </div>
        <div className="ct-clvm-disk-modal__scroll-list ct-clvm-disk-modal__mono">
          {disks.length > 0 ? disks.map((disk) => (
            <label className="ct-clvm-disk-modal__check" key={disk.id}>
              <input
                type="checkbox"
                checked={selectedIds.includes(disk.value)}
                disabled={disk.disabled}
                onChange={() => setSelectedIds((values) => toggleSelection(values, disk.value))}
              />
              <span>{disk.label}</span>
            </label>
          )) : (
            <Content component="p">데이터가 존재하지 않습니다.</Content>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="large"
      aria-label="로컬 디스크 구성"
      className="ct-clvm-disk-modal ct-clvm-disk-modal--large"
    >
      <ModalHeader title="로컬 디스크 구성" />
      <ModalBody>{renderBody()}</ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          isDisabled={loadStatus !== "success" || selectedIds.length === 0}
          onClick={() => onConfirm(selectedIds)}
        >
          구성
        </Button>
        <Button variant="link" onClick={onClose}>
          취소
        </Button>
      </ModalFooter>
    </Modal>
  );
}
