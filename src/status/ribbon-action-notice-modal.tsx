import React from "react";
import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

interface RibbonActionNoticeModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function RibbonActionNoticeModal({
  isOpen,
  title,
  message,
  onClose,
}: RibbonActionNoticeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="small"
      aria-label={title}
      className="ct-ribbon-action-notice-modal"
    >
      <ModalHeader title={title} />
      <ModalBody>
        <Content component="p">{message}</Content>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onClose}>
          확인
        </Button>
      </ModalFooter>
    </Modal>
  );
}
