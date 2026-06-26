// 스토리지센터 클러스터 카드의 CLVM 디스크 추가/삭제/정보 모달입니다.
import React from "react";
import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";
import { ExclamationTriangleIcon } from "@patternfly/react-icons";

export type ClvmDiskAction = "add" | "delete" | "info";

interface ClvmDiskActionModalProps {
  action: ClvmDiskAction | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: Exclude<ClvmDiskAction, "info">, selectedIds: string[]) => void;
}

const ADDABLE_DISKS = [
  {
    id: "mpathb",
    name: "mpathb",
    device: "/dev/mapper/mpathb",
    status: "running",
    type: "mpath",
    size: "500G",
    vendor: "DELL",
    wwn: "3600d0230000000000e13955cc3757801",
  },
  {
    id: "mpathc",
    name: "mpathc",
    device: "/dev/mapper/mpathc",
    status: "running",
    type: "mpath",
    size: "500G",
    vendor: "DELL",
    wwn: "3600d0230000000000e13955cc3757802",
  },
  {
    id: "sdd",
    name: "sdd",
    device: "/dev/sdd",
    status: "running",
    type: "disk",
    size: "1T",
    vendor: "SSD",
    wwn: "0x5002538e00000001",
    note: "Partition exists count : 1",
    disabled: true,
  },
];

const CLVM_DISKS = [
  {
    id: "vg_clvm01",
    vgName: "vg_clvm01",
    pvName: "/dev/mapper/mpathb",
    pvSize: "500G",
    wwn: "3600d0230000000000e13955cc3757801",
  },
  {
    id: "vg_clvm02",
    vgName: "vg_clvm02",
    pvName: "/dev/mapper/mpathc",
    pvSize: "500G",
    wwn: "3600d0230000000000e13955cc3757802",
  },
];

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

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedAddDisks([]);
      setSelectedDeleteDisks([]);
    }
  }, [isOpen]);

  if (!action) {
    return null;
  }

  const isAdd = action === "add";
  const isDelete = action === "delete";
  const selectedIds = isAdd ? selectedAddDisks : selectedDeleteDisks;
  const isExecutable = action === "info" || selectedIds.length > 0;
  const modalSizeClass = isAdd ? "ct-clvm-disk-modal--large" : "ct-clvm-disk-modal--medium";

  const execute = () => {
    if (action === "info") {
      onClose();
      return;
    }

    onConfirm(action, selectedIds);
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
        <div className="ct-disk-table-wrap">
          {ADDABLE_DISKS.length > 0 ? (
            <table className="ct-disk-table">
              <thead>
                <tr>
                  <th aria-label="선택" />
                  <th>디스크 이름</th>
                  <th>디스크 장치명</th>
                  <th>사이즈</th>
                  <th>유형</th>
                  <th>WWN</th>
                </tr>
              </thead>
              <tbody>
                {ADDABLE_DISKS.map((disk) => {
                  const isSelected = selectedAddDisks.includes(disk.id);
                  const toggleDisk = () => {
                    if (!disk.disabled) {
                      setSelectedAddDisks((values) => toggleSelection(values, disk.id));
                    }
                  };

                  return (
                    <tr
                      className={`${isSelected ? "ct-disk-table__row--selected" : ""}${disk.disabled ? " ct-disk-table__row--disabled" : ""}`}
                      key={disk.id}
                      onClick={toggleDisk}
                    >
                      <td className="ct-disk-table__select">
                        <input
                          type="checkbox"
                          aria-label={`${disk.name} 선택`}
                          checked={isSelected}
                          disabled={disk.disabled}
                          onClick={(event) => event.stopPropagation()}
                          onChange={toggleDisk}
                        />
                      </td>
                      <td>
                        <span className="ct-disk-table__name">{disk.name}</span>
                        {disk.note && <span className="ct-disk-table__muted">{disk.note}</span>}
                      </td>
                      <td className="ct-disk-table__mono">{disk.device}</td>
                      <td className="ct-disk-table__mono">{disk.size}</td>
                      <td>
                        <span className="ct-disk-table__status">{disk.status}</span>
                        <span className="ct-disk-table__muted">{disk.type} / {disk.vendor}</span>
                      </td>
                      <td className="ct-disk-table__mono">{disk.wwn}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <Content component="p">데이터가 존재하지 않습니다.</Content>
          )}
        </div>
      </div>
    </>
  );

  const renderDeleteBody = () => (
    <div className="ct-disk-table-wrap">
      {CLVM_DISKS.length > 0 ? (
        <table className="ct-disk-table">
          <thead>
            <tr>
              <th aria-label="선택" />
              <th>디스크 이름</th>
              <th>디스크 장치명</th>
              <th>사이즈</th>
              <th>WWN</th>
            </tr>
          </thead>
          <tbody>
            {CLVM_DISKS.map((disk) => {
              const isSelected = selectedDeleteDisks.includes(disk.id);
              const toggleDisk = () => {
                setSelectedDeleteDisks((values) => toggleSelection(values, disk.id));
              };

              return (
                <tr
                  className={isSelected ? "ct-disk-table__row--selected" : ""}
                  key={disk.id}
                  onClick={toggleDisk}
                >
                  <td className="ct-disk-table__select">
                    <input
                      type="checkbox"
                      aria-label={`${disk.vgName} 선택`}
                      checked={isSelected}
                      onClick={(event) => event.stopPropagation()}
                      onChange={toggleDisk}
                    />
                  </td>
                  <td><span className="ct-disk-table__name">{disk.vgName}</span></td>
                  <td className="ct-disk-table__mono">{disk.pvName}</td>
                  <td className="ct-disk-table__mono">{disk.pvSize}</td>
                  <td className="ct-disk-table__mono">{disk.wwn}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <Content component="p">데이터가 존재하지 않습니다.</Content>
      )}
    </div>
  );

  const renderInfoBody = () => (
    <div className="ct-clvm-disk-modal__scroll-list ct-clvm-disk-modal__mono">
      {CLVM_DISKS.length > 0 ? CLVM_DISKS.map((disk, index) => (
        <div key={disk.id}>
          {index + 1}. {disk.vgName} {disk.pvName} {disk.pvSize} {disk.wwn}
        </div>
      )) : (
        <Content component="p">데이터가 존재하지 않습니다.</Content>
      )}
    </div>
  );

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
        {isAdd && renderAddBody()}
        {isDelete && renderDeleteBody()}
        {action === "info" && renderInfoBody()}
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
