// GFS 통합 카드의 디스크 이미지 삭제 대상 조회 모달입니다.
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
  fetchRbdDiskCandidates,
  type DiskSelectionItem,
} from "../services/api/disk";

interface DiskImageActionModalProps {
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

export default function DiskImageActionModal({
  isOpen,
  onClose,
  onConfirm,
}: DiskImageActionModalProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [diskImages, setDiskImages] = React.useState<DiskSelectionItem[]>([]);
  const [loadStatus, setLoadStatus] = React.useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setDiskImages([]);
      setLoadStatus("idle");
      setErrorMessage("");
      return undefined;
    }

    let isCurrent = true;

    const loadData = async () => {
      setLoadStatus("loading");
      setErrorMessage("");

      try {
        const images = await fetchRbdDiskCandidates();

        if (!isCurrent) return;
        setDiskImages(images);
        setLoadStatus("success");
      } catch (error) {
        if (!isCurrent) return;

        console.error("disk image list API error:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "디스크 이미지 목록을 조회하지 못했습니다."
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
          <Spinner size="sm" aria-label="디스크 이미지 조회 중" />
          <Content component="p">디스크 이미지 목록을 조회중입니다.</Content>
        </div>
      );
    }

    if (loadStatus === "error") {
      return (
        <Alert isInline variant="danger" title="디스크 이미지 조회 실패">
          {errorMessage}
        </Alert>
      );
    }

    return (
      <div className="ct-action-confirm-modal__body">
        <div className="ct-clvm-disk-modal__warning">
          <ExclamationTriangleIcon aria-hidden="true" />
          <span>선택한 디스크 이미지의 모든 데이터가 영구적으로 삭제됩니다.</span>
        </div>
        <div className="ct-clvm-disk-modal__scroll-list ct-clvm-disk-modal__mono">
          {diskImages.length > 0 ? diskImages.map((disk) => (
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
      variant="medium"
      aria-label="디스크 이미지 삭제"
      className="ct-clvm-disk-modal ct-clvm-disk-modal--medium"
    >
      <ModalHeader title="디스크 이미지 삭제" />
      <ModalBody>{renderBody()}</ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          isDisabled={loadStatus !== "success" || selectedIds.length === 0}
          onClick={() => onConfirm(selectedIds)}
        >
          삭제
        </Button>
        <Button variant="link" onClick={onClose}>
          취소
        </Button>
      </ModalFooter>
    </Modal>
  );
}
