// GFS 디스크 추가/삭제/확장/상세정보 모달입니다.
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

export type GfsDiskAction = "add" | "delete" | "extend" | "info";

interface GfsDiskActionModalProps {
  action: GfsDiskAction | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: Exclude<GfsDiskAction, "info">, selectedIds: string[]) => void;
}

const AVAILABLE_DISKS = [
  {
    id: "disk-image-001",
    name: "disk-image-001",
    device: "/dev/mapper/mpathg",
    size: "500G",
    type: "mpath",
  },
  {
    id: "disk-image-002",
    name: "disk-image-002",
    device: "/dev/mapper/mpathh",
    size: "1T",
    type: "mpath",
  },
];

const GFS_DISKS = [
  {
    id: "gfs-data-01",
    name: "gfs-data-01",
    mount: "/mnt/glue-gfs",
    pv: "/dev/mapper/mpathg",
    vg: "vg_gfs01",
    size: "500G",
  },
  {
    id: "gfs-data-02",
    name: "gfs-data-02",
    mount: "/mnt/glue-gfs2",
    pv: "/dev/mapper/mpathh",
    vg: "vg_gfs02",
    size: "1T",
  },
];

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

export default function GfsDiskActionModal({
  action,
  isOpen,
  onClose,
  onConfirm,
}: GfsDiskActionModalProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [extendMethod, setExtendMethod] = React.useState("resize");
  const [isNoDowntime, setIsNoDowntime] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setExtendMethod("resize");
      setIsNoDowntime(false);
    }
  }, [isOpen]);

  if (!action) {
    return null;
  }

  const isInfo = action === "info";
  const isAdd = action === "add";
  const isExtend = action === "extend";
  const isExecutable = isInfo || selectedIds.length > 0;
  const execute = () => {
    if (isInfo) {
      onClose();
      return;
    }

    onConfirm(action, selectedIds);
  };

  const renderAvailableDiskTable = () => (
    <div className="ct-disk-table-wrap">
      {AVAILABLE_DISKS.length > 0 ? (
        <table className="ct-disk-table">
          <thead>
            <tr>
              <th aria-label="선택" />
              <th>디스크 이름</th>
              <th>디스크 장치명</th>
              <th>사이즈</th>
              <th>유형</th>
            </tr>
          </thead>
          <tbody>
            {AVAILABLE_DISKS.map((disk) => {
              const isSelected = selectedIds.includes(disk.id);
              const toggleDisk = () => {
                setSelectedIds((values) => toggleSelection(values, disk.id));
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
                      aria-label={`${disk.name} 선택`}
                      checked={isSelected}
                      onClick={(event) => event.stopPropagation()}
                      onChange={toggleDisk}
                    />
                  </td>
                  <td><span className="ct-disk-table__name">{disk.name}</span></td>
                  <td className="ct-disk-table__mono">{disk.device}</td>
                  <td className="ct-disk-table__mono">{disk.size}</td>
                  <td><span className="ct-disk-table__status">{disk.type}</span></td>
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

  const renderGfsDiskTable = () => (
    <div className="ct-disk-table-wrap">
      {GFS_DISKS.length > 0 ? (
        <table className="ct-disk-table">
          <thead>
            <tr>
              <th aria-label="선택" />
              <th>디스크 이름</th>
              <th>마운트 경로</th>
              <th>디스크 장치명</th>
              <th>볼륨 그룹</th>
              <th>사이즈</th>
            </tr>
          </thead>
          <tbody>
            {GFS_DISKS.map((disk) => {
              const isSelected = selectedIds.includes(disk.id);
              const toggleDisk = () => {
                setSelectedIds((values) => toggleSelection(values, disk.id));
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
                      aria-label={`${disk.name} 선택`}
                      checked={isSelected}
                      onClick={(event) => event.stopPropagation()}
                      onChange={toggleDisk}
                    />
                  </td>
                  <td><span className="ct-disk-table__name">{disk.name}</span></td>
                  <td className="ct-disk-table__mono">{disk.mount}</td>
                  <td className="ct-disk-table__mono">{disk.pv}</td>
                  <td className="ct-disk-table__mono">{disk.vg}</td>
                  <td className="ct-disk-table__mono">{disk.size}</td>
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

  const renderInfo = () => (
    <div className="ct-action-confirm-modal__body">
      {GFS_DISKS.map((disk) => (
        <div className="ct-gfs-disk-info" key={disk.id}>
          <div><strong>디스크 마운트 상태</strong> Health OK</div>
          <div><strong>마운트 경로</strong> {disk.mount}</div>
          <div><strong>물리 볼륨</strong> {disk.pv}</div>
          <div><strong>볼륨 그룹</strong> {disk.vg}</div>
          <div><strong>디스크 크기</strong> {disk.size}</div>
        </div>
      ))}
    </div>
  );

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
        {isAdd && (
          <div className="ct-clvm-disk-modal__warning">
            <ExclamationTriangleIcon aria-hidden="true" />
            <span>선택한 항목과 관계없이 한 번에 하나의 디스크만 생성됩니다. 원하는 디스크를 신중하게 선택하세요.</span>
          </div>
        )}
        {action === "delete" && (
          <div className="ct-clvm-disk-modal__warning">
            <ExclamationTriangleIcon aria-hidden="true" />
            <span>선택한 디스크의 모든 데이터가 영구적으로 삭제됩니다.</span>
          </div>
        )}
        {isExtend && (
          <div className="ct-action-confirm-modal__body">
            <Content component="p">확장할 GFS 디스크 및 확장 방식을 선택해주세요.</Content>
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
            <label className="ct-action-confirm-modal__check">
              <input
                type="checkbox"
                checked={isNoDowntime}
                onChange={(event) => setIsNoDowntime(event.currentTarget.checked)}
              />
              <span>무중단 확장</span>
            </label>
          </div>
        )}
        {isInfo ? renderInfo() : isAdd ? renderAvailableDiskTable() : renderGfsDiskTable()}
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
