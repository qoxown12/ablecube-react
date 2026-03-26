import React from "react";
import {
  Modal,
  Wizard,
  WizardStep,
  Title,
  Content,
  Form,
  FormGroup,
  Radio,
  TextInput,
  Button,
  Checkbox,
  Alert,
  Label,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from "@patternfly/react-core";
import { InfoCircleIcon, AngleRightIcon, ExclamationTriangleIcon } from "@patternfly/react-icons";

import "./gfs-storage-configure-wizard.scss";

type DeployPhase = "idle" | "running" | "done";
type ExternalSyncMode = "duplication" | "single" | "skip";
type IpmiMode = "common" | "individual";

interface MonitoringHostIpmi {
  hostName: string;
  ip: string;
  username: string;
  password: string;
}

interface GfsStorageConfigureWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_HOSTS: MonitoringHostIpmi[] = [
  { hostName: "ablecube21", ip: "10.10.2.1", username: "", password: "" },
  { hostName: "ablecube22", ip: "10.10.2.2", username: "", password: "" },
  { hostName: "ablecube23", ip: "10.10.2.3", username: "", password: "" },
];

const DEFAULT_DISKS = [
  { id: "mpathb", label: "/dev/mapper/mpathb (active) 1.8T DELL 3600508" },
  { id: "mpathc", label: "/dev/mapper/mpathc (active) 1.8T DELL 3600509" },
  { id: "sdb", label: "/dev/sdb (SAS) 900G SEAGATE 5000C500" },
];

export default function GfsStorageConfigureWizardModal({
  isOpen,
  onClose,
}: GfsStorageConfigureWizardModalProps) {
  const [externalSyncMode, setExternalSyncMode] = React.useState<ExternalSyncMode>("duplication");
  const [selectedDisks, setSelectedDisks] = React.useState<string[]>([]);
  const [ipmiMode, setIpmiMode] = React.useState<IpmiMode>("common");
  const [ipmiCommonUser, setIpmiCommonUser] = React.useState("");
  const [ipmiCommonPass, setIpmiCommonPass] = React.useState("");
  const [ipmiHosts, setIpmiHosts] = React.useState<MonitoringHostIpmi[]>(DEFAULT_HOSTS);

  const [reviewOpen, setReviewOpen] = React.useState({
    external: true,
    disk: true,
    ipmi: true,
  });
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deployPhase, setDeployPhase] = React.useState<DeployPhase>("idle");
  const [disableNav, setDisableNav] = React.useState(false);

  const nextStepRef = React.useRef<null | (() => void)>(null);

  const resetState = React.useCallback(() => {
    setExternalSyncMode("duplication");
    setSelectedDisks([]);
    setIpmiMode("common");
    setIpmiCommonUser("");
    setIpmiCommonPass("");
    setIpmiHosts(DEFAULT_HOSTS);
    setReviewOpen({ external: true, disk: true, ipmi: true });
    setConfirmOpen(false);
    setDeployPhase("idle");
    setDisableNav(false);
  }, []);

  const handleClose = () => {
    onClose();
    resetState();
  };

  const externalSyncLabel =
    externalSyncMode === "duplication"
      ? "이중화"
      : externalSyncMode === "single"
        ? "단중화"
        : "건너뛰기";

  const wizardFooter = (
    activeStep: any,
    goToNextStep: () => void,
    goToPrevStep: () => void,
    close: () => void
  ) => {
    if (!activeStep) return null;
    const stepId = String(activeStep.id);
    const isFirst = stepId === "gfs-overview";
    const isReview = stepId === "gfs-review";
    const isFinish = stepId === "gfs-finish";

    if (isReview) {
      nextStepRef.current = goToNextStep;
    }

    const handlePrimary = () => {
      if (isReview) {
        setConfirmOpen(true);
        return;
      }
      if (isFinish) {
        if (deployPhase === "running") {
          setDeployPhase("done");
          setDisableNav(false);
          return;
        }
        close();
        return;
      }
      goToNextStep();
    };

    const primaryLabel = isReview
      ? "배포"
      : isFinish
        ? deployPhase === "running"
          ? "완료"
          : "닫기"
        : "다음";

    return (
      <div className="ct-gfs-storage-wizard__footer">
        <Button variant="primary" onClick={handlePrimary}>
          {primaryLabel}
        </Button>
        {!isFirst && !isFinish && (
          <Button variant="secondary" onClick={goToPrevStep}>
            이전
          </Button>
        )}
        {!isFinish && (
          <Button variant="link" onClick={close}>
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
        // onClose={handleClose}
        variant="large"
        aria-label="GFS 스토리지 구성 마법사"
        className="ct-gfs-storage-wizard__modal"
      >
        <Wizard
          onClose={handleClose}
          onSave={handleClose}
          height="74vh"
          width="100%"
          navAriaLabel="GFS 스토리지 구성 단계"
          className={
            disableNav
              ? "ct-gfs-storage-wizard ct-gfs-storage-wizard--nav-locked"
              : "ct-gfs-storage-wizard"
          }
          footer={wizardFooter}
          navProps={{ "aria-disabled": disableNav }}
          onStepChange={(_event, currentStep) => {
            const stepId = String(currentStep.id);
            if (stepId === "gfs-finish" && deployPhase === "idle") {
              setDeployPhase("running");
            }
            if (stepId === "gfs-finish") {
              setDisableNav(deployPhase !== "done");
              return;
            }
            setDisableNav(false);
          }}
          header={
            <div className="ct-gfs-storage-wizard__header">
              <div>
                <Title headingLevel="h1" size="2xl" className="ct-gfs-storage-wizard__title">
                  GFS 스토리지 구성 마법사
                </Title>
                <Content className="ct-gfs-storage-wizard__subtitle">
                  <Content component="p">
                    GFS 스토리지를 모든 호스트에 구성하기 위해, 스토리지 배포를 단계별로 체계적으로 진행합니다.
                  </Content>
                </Content>
              </div>
              <button
                type="button"
                className="ct-gfs-storage-wizard__close"
                aria-label="Close"
                onClick={handleClose}
              >
                ×
              </button>
            </div>
          }
        >
          <WizardStep name="개요" id="gfs-overview">
            <div className="ct-gfs-storage-wizard__content">
              <Content>
                <Content component="p">
                  GFS 스토리지 구성 마법사는 클러스터 환경에서 GFS 스토리지를 모든 호스트에 일관되게 구성하고, 운영에 필요한
                  설정을 자동으로 적용하는 도구입니다. GFS 스토리지를 배포하기 위해서는 다음의 정보가 필요합니다.
                </Content>
                <Content component="ul">
                  <Content component="li">SAN 스토리지에서 클러스터 환경의 디스크 할당 및 WWN 정보</Content>
                  <Content component="li">클러스터 환경의 GFS 스토리지 디스크 연결</Content>
                  <Content component="li">호스트별 원격 관리(IPMI) 정보</Content>
                </Content>
                <Content component="p">
                  필요한 정보를 먼저 준비하십시오. 정보가 준비되었다면 "다음" 버튼을 눌러 GFS 스토리지 구성을 시작합니다.
                </Content>
              </Content>
            </div>
          </WizardStep>

          <WizardStep name="외부 스토리지 동기화" id="gfs-external-storage-sync">
            <div className="ct-gfs-storage-wizard__content">
              <Content component="p">
                GFS 스토리지를 배포하기 전에, 클러스터 환경에 연결된 외부 스토리지 정보를 먼저 동기화합니다. 동기화된
                디스크 정보는 GFS 클러스터 환경에서 이중화된 공유 디스크로 사용됩니다.
              </Content>
              <div className="ct-gfs-storage-wizard__warn">
                <ExclamationTriangleIcon className="ct-gfs-storage-wizard__warn-icon" aria-hidden="true" />
                외부 스토리지 정보를 동기화하려면, FC 카드 또는 iSCSI 카드가 물리적으로 이중화 구성이 되어 있어야 합니다.
              </div>
              <Form className="ct-gfs-storage-wizard__section ct-gfs-storage-wizard__form-horizontal" isHorizontal>
                <FormGroup label="외부 스토리지 동기화 방식" isRequired fieldId="gfs-external-sync-mode">
                  <div>
                    <Radio
                      id="gfs-external-duplication"
                      name="gfs-external-sync"
                      label="이중화"
                      isChecked={externalSyncMode === "duplication"}
                      onChange={() => setExternalSyncMode("duplication")}
                    />
                    <Radio
                      id="gfs-external-single"
                      name="gfs-external-sync"
                      label="단중화"
                      isChecked={externalSyncMode === "single"}
                      onChange={() => setExternalSyncMode("single")}
                    />
                    <Radio
                      id="gfs-external-skip"
                      name="gfs-external-sync"
                      label="건너뛰기"
                      isChecked={externalSyncMode === "skip"}
                      onChange={() => setExternalSyncMode("skip")}
                    />
                    <div className="ct-gfs-storage-wizard__helper-text">
                      이중화 옵션 선택 시 동기화 완료 후 다음 단계로 진행해 주세요.
                    </div>
                  </div>
                </FormGroup>
                <FormGroup label="외부 스토리지 동기화" fieldId="gfs-external-sync-action">
                  <Button variant="secondary" isDisabled={externalSyncMode === "skip"}>
                    외부 스토리지 동기화 활성화
                  </Button>
                </FormGroup>
              </Form>
              <Alert
                isInline
                title="외부 스토리지 동기화 참고사항"
                variant="info"
                icon={<InfoCircleIcon />}
                className="ct-gfs-storage-wizard__info"
              >
                <Content component="p">
                  외부 스토리지를 동기화하기 전에, 클러스터 내 각 호스트에 외부 스토리지 디스크가 정상적으로 할당되어 있는지
                  반드시 확인해야 합니다.
                </Content>
                <Content component="p">
                  이중화 구성이 완료된 후 GFS 디스크를 재구성하는 경우, 멀티패스 구성이 이미 완료되어 있는지 확인하십시오.
                  구성이 완료되어 있다면 "건너뛰기" 옵션을 선택한 후 다음 단계로 진행해 주시기 바랍니다.
                </Content>
              </Alert>
            </div>
          </WizardStep>

          <WizardStep name="GFS 디스크 구성" id="gfs-disk-configure">
            <div className="ct-gfs-storage-wizard__content">
              <Content component="p">
                GFS용 디스크로 관리할 "클러스터에 연결된 iSCSI 또는 FC 디스크"를 선택해야 합니다.
              </Content>
              <Form className="ct-gfs-storage-wizard__section ct-gfs-storage-wizard__form-horizontal" isHorizontal>
                <FormGroup label="GFS용 디스크 구성 대상 장치" isRequired fieldId="gfs-disk-list">
                  <div className="ct-gfs-storage-wizard__disk-list">
                    {DEFAULT_DISKS.map((disk) => (
                      <div key={disk.id} className="ct-gfs-storage-wizard__disk-item">
                        <Checkbox
                          id={`gfs-disk-${disk.id}`}
                          label={disk.label}
                          isChecked={selectedDisks.includes(disk.id)}
                          onChange={(_event, checked) => {
                            setSelectedDisks((prev) =>
                              checked ? [...prev, disk.id] : prev.filter((item) => item !== disk.id)
                            );
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </FormGroup>
              </Form>
              <Alert
                isInline
                title="GFS용 디스크 자원 구성 시 참고사항"
                variant="info"
                icon={<InfoCircleIcon />}
                className="ct-gfs-storage-wizard__info"
              >
                <Content component="p">
                  GFS 파일 시스템은 Linux 커널 파일 시스템 인터페이스(VFS 레이어)와 직접 연결 시키는 원시적 파일 시스템입니다.
                </Content>
                <Content component="p">
                  사용할 GFS용 디스크가 알맞는지 종류, 사이즈 및 경로(WWN)를 잘 확인하시기 바랍니다.
                </Content>
              </Alert>
            </div>
          </WizardStep>

          <WizardStep name="IPMI 정보" id="gfs-ipmi">
            <div className="ct-gfs-storage-wizard__content">
              <Content component="p">
                클러스터를 구성하기 위한 각 호스트의 IPMI 정보를 설정합니다. 아래의 항목에 값을 입력하십시오.
              </Content>
              <Form className="ct-gfs-storage-wizard__section ct-gfs-storage-wizard__form-horizontal" isHorizontal>
                <FormGroup label="IPMI 구성 준비" isRequired fieldId="gfs-ipmi-mode">
                  <div>
                    <Radio
                      id="gfs-ipmi-common"
                      name="gfs-ipmi-mode"
                      label="공통 자격 증명"
                      isChecked={ipmiMode === "common"}
                      onChange={() => setIpmiMode("common")}
                    />
                    <Radio
                      id="gfs-ipmi-individual"
                      name="gfs-ipmi-mode"
                      label="개별 자격 증명"
                      isChecked={ipmiMode === "individual"}
                      onChange={() => setIpmiMode("individual")}
                    />
                  </div>
                </FormGroup>
              </Form>

              {ipmiMode === "common" ? (
                <Form className="ct-gfs-storage-wizard__section ct-gfs-storage-wizard__form-horizontal" isHorizontal>
                  <FormGroup label="공통 사용자" isRequired fieldId="gfs-ipmi-common-user">
                    <TextInput
                      id="gfs-ipmi-common-user"
                      value={ipmiCommonUser}
                      onChange={(_event, value) => setIpmiCommonUser(String(value))}
                    />
                  </FormGroup>
                  <FormGroup label="공통 비밀번호" isRequired fieldId="gfs-ipmi-common-pass">
                    <TextInput
                      id="gfs-ipmi-common-pass"
                      type="password"
                      value={ipmiCommonPass}
                      onChange={(_event, value) => setIpmiCommonPass(String(value))}
                    />
                  </FormGroup>
                  {ipmiHosts.map((host, index) => (
                    <FormGroup
                      key={`gfs-ipmi-common-${host.hostName}`}
                      label={`${host.hostName} IPMI IP`}
                      isRequired
                      fieldId={`gfs-ipmi-common-ip-${index}`}
                    >
                      <TextInput
                        id={`gfs-ipmi-common-ip-${index}`}
                        value={host.ip}
                        onChange={(_event, value) => {
                          setIpmiHosts((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], ip: String(value) };
                            return next;
                          });
                        }}
                      />
                    </FormGroup>
                  ))}
                </Form>
              ) : (
                <Form className="ct-gfs-storage-wizard__section ct-gfs-storage-wizard__form-horizontal" isHorizontal>
                  {ipmiHosts.map((host, index) => (
                    <React.Fragment key={`gfs-ipmi-individual-${host.hostName}`}>
                      <FormGroup label={`${host.hostName} IPMI IP`} isRequired fieldId={`gfs-ipmi-ip-${index}`}>
                        <TextInput
                          id={`gfs-ipmi-ip-${index}`}
                          value={host.ip}
                          onChange={(_event, value) => {
                            setIpmiHosts((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], ip: String(value) };
                              return next;
                            });
                          }}
                        />
                      </FormGroup>
                      <FormGroup label={`${host.hostName} 사용자`} isRequired fieldId={`gfs-ipmi-user-${index}`}>
                        <TextInput
                          id={`gfs-ipmi-user-${index}`}
                          value={host.username}
                          onChange={(_event, value) => {
                            setIpmiHosts((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], username: String(value) };
                              return next;
                            });
                          }}
                        />
                      </FormGroup>
                      <FormGroup label={`${host.hostName} 비밀번호`} isRequired fieldId={`gfs-ipmi-pass-${index}`}>
                        <TextInput
                          id={`gfs-ipmi-pass-${index}`}
                          type="password"
                          value={host.password}
                          onChange={(_event, value) => {
                            setIpmiHosts((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], password: String(value) };
                              return next;
                            });
                          }}
                        />
                      </FormGroup>
                    </React.Fragment>
                  ))}
                </Form>
              )}
            </div>
          </WizardStep>

          <WizardStep name="설정확인" id="gfs-review">
            <div className="ct-gfs-storage-wizard__content">
              <Content>
                <Content component="p">
                  GFS 스토리지 구성을 위해 입력한 설정 정보는 다음과 같습니다. 입력한 정보를 수정하고자 하는 경우, 해당 탭으로
                  이동하여 정보를 수정하십시오.
                </Content>
                <Content component="p">모든 정보를 확인한 후 "배포"를 시작합니다.</Content>
              </Content>
              <div className="ct-gfs-storage-wizard__review-accordion">
                <div className="ct-gfs-storage-wizard__review-section">
                  <button
                    type="button"
                    className="ct-gfs-storage-wizard__review-header"
                    onClick={() => setReviewOpen((prev) => ({ ...prev, external: !prev.external }))}
                  >
                    <span>외부 스토리지 동기화</span>
                    <span className={reviewOpen.external ? "ct-gfs-chevron ct-gfs-chevron--open" : "ct-gfs-chevron"}>
                      <AngleRightIcon aria-hidden="true" />
                    </span>
                  </button>
                  {reviewOpen.external && (
                    <div className="ct-gfs-storage-wizard__review-body">
                      <DescriptionList isHorizontal className="ct-gfs-storage-wizard__review-detail">
                        <DescriptionListGroup>
                          <DescriptionListTerm>외부 스토리지 동기화 방식</DescriptionListTerm>
                          <DescriptionListDescription>{externalSyncLabel}</DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </div>
                  )}
                </div>

                <div className="ct-gfs-storage-wizard__review-section">
                  <button
                    type="button"
                    className="ct-gfs-storage-wizard__review-header"
                    onClick={() => setReviewOpen((prev) => ({ ...prev, disk: !prev.disk }))}
                  >
                    <span>GFS 디스크 구성</span>
                    <span className={reviewOpen.disk ? "ct-gfs-chevron ct-gfs-chevron--open" : "ct-gfs-chevron"}>
                      <AngleRightIcon aria-hidden="true" />
                    </span>
                  </button>
                  {reviewOpen.disk && (
                    <div className="ct-gfs-storage-wizard__review-body">
                      <DescriptionList isHorizontal className="ct-gfs-storage-wizard__review-detail">
                        <DescriptionListGroup>
                          <DescriptionListTerm>GFS 디스크</DescriptionListTerm>
                          <DescriptionListDescription>
                            {selectedDisks.length === 0
                              ? "미선택"
                              : selectedDisks
                                  .map((diskId) => DEFAULT_DISKS.find((disk) => disk.id === diskId)?.label || diskId)
                                  .join(", ")}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </div>
                  )}
                </div>

                <div className="ct-gfs-storage-wizard__review-section">
                  <button
                    type="button"
                    className="ct-gfs-storage-wizard__review-header"
                    onClick={() => setReviewOpen((prev) => ({ ...prev, ipmi: !prev.ipmi }))}
                  >
                    <span>IPMI 정보</span>
                    <span className={reviewOpen.ipmi ? "ct-gfs-chevron ct-gfs-chevron--open" : "ct-gfs-chevron"}>
                      <AngleRightIcon aria-hidden="true" />
                    </span>
                  </button>
                  {reviewOpen.ipmi && (
                    <div className="ct-gfs-storage-wizard__review-body">
                      <DescriptionList isHorizontal className="ct-gfs-storage-wizard__review-detail">
                        <DescriptionListGroup>
                          <DescriptionListTerm>IPMI 구성</DescriptionListTerm>
                          <DescriptionListDescription>{ipmiMode === "common" ? "공통 자격 증명" : "개별 자격 증명"}</DescriptionListDescription>
                        </DescriptionListGroup>
                        {ipmiMode === "common" ? (
                          <>
                            <DescriptionListGroup>
                              <DescriptionListTerm>공통 사용자</DescriptionListTerm>
                              <DescriptionListDescription>{ipmiCommonUser || "미입력"}</DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>공통 비밀번호</DescriptionListTerm>
                              <DescriptionListDescription>{ipmiCommonPass ? "●●●●●●" : "미입력"}</DescriptionListDescription>
                            </DescriptionListGroup>
                          </>
                        ) : null}
                        <DescriptionListGroup>
                          <DescriptionListTerm>호스트 IPMI</DescriptionListTerm>
                          <DescriptionListDescription>
                            {ipmiHosts.map((host) => (
                              <div key={`review-ipmi-${host.hostName}`}>
                                {host.hostName}: {host.ip || "미입력"}
                              </div>
                            ))}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </WizardStep>

          <WizardStep name="완료" id="gfs-finish">
            <div className="ct-gfs-storage-wizard__content">
              {deployPhase === "running" ? (
                <>
                  <Content component="p" className="ct-gfs-storage-wizard__deploy-title">
                    GFS 스토리지를 구성 중입니다. 전체 3단계 중 2단계 진행 중입니다.
                  </Content>
                  <div className="ct-gfs-storage-wizard__status-list">
                    <div>
                      <Label color="green">완료됨</Label>
                      <span>클러스터 구성 HOST 간 연결 상태 확인</span>
                    </div>
                    <div>
                      <Label color="orange">진행중</Label>
                      <span>클러스터 구성 설정 초기화 작업</span>
                    </div>
                    <div>
                      <Label color="blue">준비중</Label>
                      <span>GFS 구성 설정 및 PCS 구성 설정</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Content component="p">
                    GFS 스토리지 구성을 완료하였습니다. 아래 내용을 참고하여 GFS 디스크와 PCS가 정상적으로 설정되어 작동하는지
                    확인한 후, 다음 단계로 진행하시기 바랍니다.
                  </Content>
                  <Content component="p" className="ct-gfs-storage-wizard__section">
                    모든 호스트에 GFS 구성이 완료 되었는지 확인합니다.
                    <br />
                    확인 명령어: <code>lsblk</code>, <code>lvs</code>, <code>vgs</code>, <code>pvs</code>
                  </Content>
                  <Content component="p">
                    선택한 하나의 호스트에서 PCS 설정이 올바르게 완료되었는지 확인합니다.
                    <br />
                    확인 명령어: <code>pcs status</code>
                  </Content>
                  <Content component="p" className="ct-gfs-storage-wizard__section">
                    확인 결과 이상이 없다면, 클라우드센터 VM 배포를 진행해 주세요. 마법사를 종료하려면 화면 상단의 닫기 버튼을
                    클릭하십시오.
                  </Content>
                </>
              )}
            </div>
          </WizardStep>
        </Wizard>
      </Modal>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-label="GFS 스토리지 구성 진행"
        variant="small"
        title="GFS 스토리지 구성 진행"
        actions={[
          <Button
            key="confirm"
            variant="primary"
            onClick={() => {
              setConfirmOpen(false);
              nextStepRef.current?.();
            }}
          >
            실행
          </Button>,
          <Button key="cancel" variant="link" onClick={() => setConfirmOpen(false)}>
            아니요
          </Button>,
        ]}
      >
        <Content component="p">GFS 스토리지 구성을 진행하시겠습니까?</Content>
      </Modal>
    </>
  );
}
