import React from "react";
import {
  Alert,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  Spinner,
  Title,
  Wizard,
  WizardStep,
} from "@patternfly/react-core";
import {
  AngleRightIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
} from "@patternfly/react-icons";

import ValidationErrorModal from "../components/common/ValidationErrorModal";
import {
  fetchGfsDiskCandidates,
  type DiskSelectionItem,
} from "../services/api/disk";
import {
  createLocalDisk,
  resetLocalDisk,
} from "../services/api/local-disk-status";
import "./local-storage-configure-wizard.scss";

type DiskLoadStatus = "idle" | "loading" | "success" | "error";
type DeployPhase = "idle" | "running" | "success" | "error";
type DeployStepKey = "reset" | "create";
type DeployStepStatus = "waiting" | "running" | "success" | "error";

interface LocalStorageConfigureWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEPLOY_STEP_LABELS: Record<DeployStepKey, string> = {
  reset: "로컬 스토리지 초기화",
  create: "스토리지 구성 설정",
};

const INITIAL_DEPLOY_STEPS: Record<DeployStepKey, DeployStepStatus> = {
  reset: "waiting",
  create: "waiting",
};

function deployStepColor(status: DeployStepStatus) {
  switch (status) {
    case "success":
      return "green";
    case "running":
      return "orange";
    case "error":
      return "red";
    default:
      return "blue";
  }
}

function deployStepText(status: DeployStepStatus) {
  switch (status) {
    case "success":
      return "완료됨";
    case "running":
      return "진행중";
    case "error":
      return "실패";
    default:
      return "준비중";
  }
}

export default function LocalStorageConfigureWizardModal({
  isOpen,
  onClose,
}: LocalStorageConfigureWizardModalProps) {
  const [diskLoadStatus, setDiskLoadStatus] = React.useState<DiskLoadStatus>("idle");
  const [diskLoadError, setDiskLoadError] = React.useState("");
  const [disks, setDisks] = React.useState<DiskSelectionItem[]>([]);
  const [selectedDisk, setSelectedDisk] = React.useState("");
  const [reviewOpen, setReviewOpen] = React.useState(true);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = React.useState(false);
  const [validationMessage, setValidationMessage] = React.useState("");
  const [disableNav, setDisableNav] = React.useState(false);
  const [deployPhase, setDeployPhase] = React.useState<DeployPhase>("idle");
  const [deploySteps, setDeploySteps] =
    React.useState<Record<DeployStepKey, DeployStepStatus>>(INITIAL_DEPLOY_STEPS);
  const [deployError, setDeployError] = React.useState("");
  const [advanceToDeployOnStart, setAdvanceToDeployOnStart] = React.useState(false);

  const deployNextStepRef = React.useRef<null | (() => void)>(null);

  const selectedDiskInfo = disks.find((disk) => disk.value === selectedDisk);

  const resetState = React.useCallback(() => {
    setDiskLoadStatus("idle");
    setDiskLoadError("");
    setDisks([]);
    setSelectedDisk("");
    setReviewOpen(true);
    setConfirmOpen(false);
    setCancelConfirmOpen(false);
    setValidationMessage("");
    setDisableNav(false);
    setDeployPhase("idle");
    setDeploySteps(INITIAL_DEPLOY_STEPS);
    setDeployError("");
    setAdvanceToDeployOnStart(false);
  }, []);

  const loadDiskCandidates = React.useCallback(() => {
    let isCurrent = true;

    setDiskLoadStatus("loading");
    setDiskLoadError("");
    setDisks([]);
    setSelectedDisk("");

    fetchGfsDiskCandidates()
      .then((nextDisks) => {
        if (!isCurrent) return;
        setDisks(nextDisks);
        setDiskLoadStatus("success");
      })
      .catch((error) => {
        if (!isCurrent) return;
        setDiskLoadError(
          error instanceof Error
            ? error.message
            : "로컬 디스크 후보 목록을 조회하지 못했습니다."
        );
        setDiskLoadStatus("error");
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    return loadDiskCandidates();
  }, [isOpen, loadDiskCandidates]);

  const handleClose = () => {
    onClose();
    resetState();
  };

  const requestClose = () => {
    if (deployPhase === "running") {
      return;
    }
    setCancelConfirmOpen(true);
  };

  const validateLocalStorage = () => {
    if (!selectedDisk) {
      return "로컬 디스크를 선택해주세요.";
    }

    return "";
  };

  const executeDeploy = async () => {
    const message = validateLocalStorage();
    if (message) {
      setValidationMessage(message);
      setConfirmOpen(false);
      return;
    }

    setConfirmOpen(false);
    setDeployPhase("running");
    setDisableNav(true);
    setDeployError("");
    setDeploySteps({
      reset: "running",
      create: "waiting",
    });
    if (advanceToDeployOnStart) {
      deployNextStepRef.current?.();
    }
    setAdvanceToDeployOnStart(false);

    try {
      await resetLocalDisk();
      setDeploySteps({
        reset: "success",
        create: "running",
      });

      await createLocalDisk([selectedDisk]);
      setDeploySteps({
        reset: "success",
        create: "success",
      });
      setDeployPhase("success");
      setDisableNav(false);
    } catch (error) {
      setDeploySteps((prev) => {
        const failedStep = prev.reset === "running" ? "reset" : "create";

        return {
          ...prev,
          [failedStep]: "error",
        };
      });
      setDeployPhase("error");
      setDeployError(
        error instanceof Error
          ? error.message
          : "로컬 스토리지 구성 중 오류가 발생했습니다."
      );
      setDisableNav(false);
    }
  };

  const retryDeploy = () => {
    setDeployPhase("idle");
    setDeploySteps(INITIAL_DEPLOY_STEPS);
    setDeployError("");
    setAdvanceToDeployOnStart(false);
    setConfirmOpen(true);
  };

  const renderDiskList = () => {
    if (diskLoadStatus === "loading") {
      return (
        <div className="ct-local-storage-wizard__loading">
          <Spinner size="sm" aria-label="로컬 디스크 후보 조회 중" />
          <Content component="p">로컬 디스크 후보 목록을 조회중입니다.</Content>
        </div>
      );
    }

    if (diskLoadStatus === "error") {
      return (
        <Alert isInline variant="danger" title="로컬 디스크 후보 조회 실패">
          {diskLoadError}
        </Alert>
      );
    }

    if (disks.length === 0) {
      return <Content component="p">데이터가 존재하지 않습니다.</Content>;
    }

    return disks.map((disk) => (
      <div key={disk.id} className="ct-local-storage-wizard__disk-item">
        <Radio
          id={`local-disk-${disk.id}`}
          name="local-storage-disk"
          label={disk.label}
          isChecked={selectedDisk === disk.value}
          isDisabled={disk.disabled}
          onChange={() => setSelectedDisk(disk.value)}
        />
      </div>
    ));
  };

  const wizardFooter = (
    activeStep: any,
    goToNextStep: () => void,
    goToPrevStep: () => void,
    close: () => void
  ) => {
    if (!activeStep) return null;

    const stepId = String(activeStep.id);
    const isFirst = stepId === "local-overview";
    const isDiskConfigure = stepId === "local-disk-configure";
    const isReview = stepId === "local-review";
    const isDeploy = stepId === "local-deploy";
    const isFinish = stepId === "local-finish";

    if (isReview) {
      deployNextStepRef.current = goToNextStep;
    }

    const handlePrimary = () => {
      if (isDiskConfigure) {
        const message = validateLocalStorage();
        if (message) {
          setValidationMessage(message);
          return;
        }
        goToNextStep();
        return;
      }

      if (isReview) {
        setAdvanceToDeployOnStart(true);
        setConfirmOpen(true);
        return;
      }

      if (isDeploy) {
        if (deployPhase === "success") {
          goToNextStep();
          return;
        }
        if (deployPhase === "error") {
          retryDeploy();
        }
        return;
      }

      if (isFinish) {
        close();
        return;
      }

      goToNextStep();
    };

    const primaryLabel = isReview
      ? "배포"
      : isDeploy
        ? deployPhase === "error"
          ? "다시 시도"
          : "다음"
        : isFinish
          ? "닫기"
          : "다음";
    const primaryDisabled =
      (isDiskConfigure && diskLoadStatus !== "success") ||
      (isDeploy && (deployPhase === "running" || deployPhase === "idle"));

    return (
      <div className="ct-local-storage-wizard__footer">
        <Button
          variant="primary"
          onClick={handlePrimary}
          isDisabled={primaryDisabled}
        >
          {primaryLabel}
        </Button>
        {!isFirst && !isDeploy && !isFinish && (
          <Button variant="secondary" onClick={goToPrevStep}>
            이전
          </Button>
        )}
        {!isDeploy && !isFinish && (
          <Button variant="link" onClick={requestClose}>
            취소
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        variant="large"
        aria-label="로컬 스토리지 구성 마법사"
        className="ct-local-storage-wizard__modal"
      >
        <Wizard
          onClose={requestClose}
          onSave={handleClose}
          width="100%"
          navAriaLabel="로컬 스토리지 구성 단계"
          className={
            disableNav
              ? "ct-local-storage-wizard ct-local-storage-wizard--nav-locked"
              : "ct-local-storage-wizard"
          }
          footer={wizardFooter}
          onStepChange={(_event, currentStep) => {
            const stepId = String(currentStep.id);
            if (stepId === "local-deploy") {
              setDisableNav(true);
              return;
            }
            setDisableNav(deployPhase === "running");
          }}
          header={
            <div className="ct-local-storage-wizard__header">
              <div>
                <Title headingLevel="h1" size="2xl" className="ct-local-storage-wizard__title">
                  로컬 스토리지 구성 마법사
                </Title>
                <Content className="ct-local-storage-wizard__subtitle">
                  <Content component="p">
                    로컬 스토리지를 모든 호스트에 구성하기 위해, 스토리지 배포를 단계별로 체계적으로 진행합니다.
                  </Content>
                </Content>
              </div>
              <button
                type="button"
                className="ct-local-storage-wizard__close"
                aria-label="Close"
                onClick={requestClose}
              >
                ×
              </button>
            </div>
          }
        >
          <WizardStep name="개요" id="local-overview">
            <div className="ct-local-storage-wizard__content">
              <Content>
                <Content component="p">
                  로컬 스토리지 구성 마법사는 단일 서버의 로컬 스토리지를 활용하여 운영에 필요한 설정을 자동화하는 도구입니다.
                  로컬 스토리지를 구성하기 위해서는 다음과 같은 정보가 필요합니다.
                </Content>
                <Content component="ul">
                  <Content component="li">가상화 영역 디스크의 RAID 구성</Content>
                  <Content component="li">운영 안정성을 뒷받침하는 적정 디스크 용량</Content>
                </Content>
                <Content component="p">
                  위 정보를 미리 준비한 후, "다음" 버튼을 눌러 로컬 스토리지 구성을 시작하십시오.
                </Content>
              </Content>
            </div>
          </WizardStep>

          <WizardStep name="로컬 디스크 구성" id="local-disk-configure">
            <div className="ct-local-storage-wizard__content">
              <Content component="p">
                로컬 스토리지 구성 시, 서버에서 물리적으로 인식된 디스크를 선택하여 관리 대상으로 지정해야 합니다.
              </Content>
              <div className="ct-local-storage-wizard__form-row">
                <div className="ct-local-storage-wizard__field-label">
                  로컬용 디스크 구성 대상 장치 <span aria-hidden="true">*</span>
                </div>
                <div className="ct-local-storage-wizard__disk-list">
                  {renderDiskList()}
                </div>
              </div>
              <Alert
                isInline
                title="로컬용 디스크 자원 구성 필수 준수사항"
                variant="info"
                icon={<InfoCircleIcon />}
                className="ct-local-storage-wizard__info"
              >
                <Content component="p">
                  로컬 스토리지는 서버 내부의 직접 연결 디스크를 기반으로 동작하며, 운영 환경에 따라 안정성과 성능에 큰 영향을
                  미칩니다.
                </Content>
                <Content component="p">
                  여러 물리 디스크가 보일 경우 개별 디스크를 직접 선택해 구성하지 말고, 먼저 BIOS/RAID 컨트롤러에서 필요한
                  수준의 RAID를 사전에 구성하여 하나의 논리 디스크로 만든 뒤 그 논리 디스크만 선택해 설치를 진행해야 합니다.
                </Content>
                <Content component="p">
                  또한 구성 시에는 디스크의 종류, 총 용량, 인터페이스와 경로를 반드시 확인하여 오선택을 방지하시기 바랍니다.
                </Content>
              </Alert>
            </div>
          </WizardStep>

          <WizardStep name="설정확인" id="local-review">
            <div className="ct-local-storage-wizard__content">
              <Content>
                <Content component="p">
                  로컬 스토리지 구성을 위해 입력한 설정 정보는 다음과 같습니다. 입력한 정보를 수정하고자 하는 경우, 해당 탭으로
                  이동하여 정보를 수정하십시오.
                </Content>
                <Content component="p">모든 정보를 확인한 후 "배포"를 시작합니다.</Content>
              </Content>
              <div className="ct-local-storage-wizard__review-accordion">
                <div className="ct-local-storage-wizard__review-section">
                  <button
                    type="button"
                    className="ct-local-storage-wizard__review-header"
                    onClick={() => setReviewOpen((prev) => !prev)}
                  >
                    <span>로컬 디스크 구성</span>
                    <span className={reviewOpen ? "ct-local-chevron ct-local-chevron--open" : "ct-local-chevron"}>
                      <AngleRightIcon aria-hidden="true" />
                    </span>
                  </button>
                  {reviewOpen && (
                    <div className="ct-local-storage-wizard__review-body">
                      <DescriptionList isHorizontal className="ct-local-storage-wizard__review-detail">
                        <DescriptionListGroup>
                          <DescriptionListTerm>로컬 디스크</DescriptionListTerm>
                          <DescriptionListDescription>
                            {(selectedDiskInfo?.label ?? selectedDisk) || "미선택"}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </WizardStep>

          <WizardStep name="배포" id="local-deploy">
            <div className="ct-local-storage-wizard__content">
              <Content component="p" className="ct-local-storage-wizard__deploy-title">
                로컬 스토리지를 구성 중입니다. 전체 2단계 중 {
                  deploySteps.create === "success"
                    ? "2"
                    : deploySteps.reset === "success"
                      ? "2"
                      : "1"
                }단계 진행 중입니다.
              </Content>
              <div className="ct-local-storage-wizard__status-list">
                {(Object.keys(DEPLOY_STEP_LABELS) as DeployStepKey[]).map((stepKey) => {
                  const status = deploySteps[stepKey];

                  return (
                    <div key={stepKey}>
                      <Label color={deployStepColor(status)}>
                        {deployStepText(status)}
                      </Label>
                      {status === "running" && <Spinner size="sm" />}
                      <span>{DEPLOY_STEP_LABELS[stepKey]}</span>
                    </div>
                  );
                })}
              </div>
              {deployPhase === "error" && (
                <Alert
                  isInline
                  variant="danger"
                  title="로컬 스토리지 구성 실패"
                  className="ct-local-storage-wizard__deploy-alert"
                >
                  {deployError}
                </Alert>
              )}
              {deployPhase === "success" && (
                <Alert
                  isInline
                  variant="success"
                  title="로컬 스토리지 구성 완료"
                  className="ct-local-storage-wizard__deploy-alert"
                >
                  다음 단계로 진행해 완료 내용을 확인하십시오.
                </Alert>
              )}
            </div>
          </WizardStep>

          <WizardStep name="완료" id="local-finish">
            <div className="ct-local-storage-wizard__content">
              <Content component="p">
                로컬 스토리지 구성을 완료하였습니다. 아래 내용을 참고하여 로컬 디스크가 정상적으로 설정되어 작동하는지 확인한 후,
                다음 단계로 진행하시기 바랍니다.
              </Content>
              <Content component="p" className="ct-local-storage-wizard__section">
                모든 호스트에 로컬 구성이 완료 되었는지 확인합니다.
                <br />
                확인 명령어: <code>lsblk</code>, <code>lvs</code>, <code>vgs</code>, <code>pvs</code>
              </Content>
              <Content component="p" className="ct-local-storage-wizard__section">
                확인 결과 이상이 없다면, 클라우드센터 VM 배포를 진행해 주세요. 마법사를 종료하려면 화면 상단의 닫기 버튼을
                클릭하십시오.
              </Content>
            </div>
          </WizardStep>
        </Wizard>
      </Modal>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-label="로컬 스토리지 구성 진행"
        variant="small"
      >
        <ModalHeader title="로컬 스토리지 구성 진행" />
        <ModalBody>
          <Content component="p">로컬 스토리지 구성을 진행하시겠습니까?</Content>
          <div className="ct-local-storage-wizard__confirm-warning">
            <ExclamationTriangleIcon aria-hidden="true" />
            <span>선택한 디스크의 기존 데이터가 삭제될 수 있습니다.</span>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={executeDeploy}>
            실행
          </Button>
          <Button variant="link" onClick={() => setConfirmOpen(false)}>
            아니요
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        aria-label="로컬 스토리지 구성 취소"
        variant="small"
      >
        <ModalHeader title="로컬 스토리지 구성 취소" />
        <ModalBody>
          <Content component="p">
            로컬 스토리지 구성을 취소하시겠습니까? 입력된 데이터는 초기화 됩니다.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={handleClose}>
            실행
          </Button>
          <Button variant="link" onClick={() => setCancelConfirmOpen(false)}>
            아니요
          </Button>
        </ModalFooter>
      </Modal>

      <ValidationErrorModal
        isOpen={Boolean(validationMessage)}
        message={validationMessage}
        onClose={() => setValidationMessage("")}
      />
    </>
  );
}
