import React from "react";
import {
  Modal,
  Wizard,
  WizardStep,
  Title,
  Content,
  Form,
  FormGroup,
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
import { InfoCircleIcon, AngleRightIcon } from "@patternfly/react-icons";

import "./monitoring-center-wizard.scss";

type DeployPhase = "idle" | "running" | "done";

interface MonitoringCenterWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_HOST_COUNT = 3;
const DEFAULT_CCVM_IP = "10.10.2.10";
const DEFAULT_CUBE_HOSTS = ["10.10.2.1", "10.10.2.2", "10.10.2.3"];
const DEFAULT_SCVM_HOSTS = ["10.10.2.11", "10.10.2.12", "10.10.2.13"];

export default function MonitoringCenterWizardModal({
  isOpen,
  onClose,
}: MonitoringCenterWizardModalProps) {
  const [hostCount, setHostCount] = React.useState(DEFAULT_HOST_COUNT);
  const [ccvmIp, setCcvmIp] = React.useState(DEFAULT_CCVM_IP);
  const [cubeHosts, setCubeHosts] = React.useState<string[]>(DEFAULT_CUBE_HOSTS);
  const [scvmHosts, setScvmHosts] = React.useState<string[]>(DEFAULT_SCVM_HOSTS);

  const [smtpEnabled, setSmtpEnabled] = React.useState(false);
  const [smtpServer, setSmtpServer] = React.useState("");
  const [smtpPort, setSmtpPort] = React.useState("");
  const [smtpEmail, setSmtpEmail] = React.useState("");
  const [smtpPassword, setSmtpPassword] = React.useState("");
  const [smtpReceivers, setSmtpReceivers] = React.useState("");

  const [reviewOpen, setReviewOpen] = React.useState({
    ip: true,
    smtp: true,
  });
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deployPhase, setDeployPhase] = React.useState<DeployPhase>("idle");
  const [disableNav, setDisableNav] = React.useState(false);

  const nextStepRef = React.useRef<null | (() => void)>(null);

  const resetState = React.useCallback(() => {
    setHostCount(DEFAULT_HOST_COUNT);
    setCcvmIp(DEFAULT_CCVM_IP);
    setCubeHosts(DEFAULT_CUBE_HOSTS);
    setScvmHosts(DEFAULT_SCVM_HOSTS);
    setSmtpEnabled(false);
    setSmtpServer("");
    setSmtpPort("");
    setSmtpEmail("");
    setSmtpPassword("");
    setSmtpReceivers("");
    setReviewOpen({ ip: true, smtp: true });
    setConfirmOpen(false);
    setDeployPhase("idle");
    setDisableNav(false);
  }, []);

  const handleClose = () => {
    onClose();
    resetState();
  };

  const updateHostCount = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    const nextCount = Math.max(1, Math.min(9, parsed));
    setHostCount(nextCount);
    setCubeHosts(Array.from({ length: nextCount }, () => ""));
    setScvmHosts(Array.from({ length: nextCount }, () => ""));
  };

  const smtpEnabledLabel = smtpEnabled ? "설정함" : "미설정";

  const wizardFooter = (
    activeStep: any,
    goToNextStep: () => void,
    goToPrevStep: () => void,
    close: () => void
  ) => {
    if (!activeStep) return null;
    const stepId = String(activeStep.id);
    const isFirst = stepId === "monitoring-overview";
    const isReview = stepId === "monitoring-review";
    const isFinish = stepId === "monitoring-finish";

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
      ? "구성"
      : isFinish
        ? deployPhase === "running"
          ? "완료"
          : "닫기"
        : "다음";

    return (
      <div className="ct-monitoring-center-wizard__footer">
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
        aria-label="모니터링센터 구성 마법사"
        className="ct-monitoring-center-wizard__modal"
      >
        <Wizard
          onClose={handleClose}
          onSave={handleClose}
          height="74vh"
          width="100%"
          navAriaLabel="모니터링센터 구성 단계"
          className={
            disableNav
              ? "ct-monitoring-center-wizard ct-monitoring-center-wizard--nav-locked"
              : "ct-monitoring-center-wizard"
          }
          footer={wizardFooter}
          navProps={{ "aria-disabled": disableNav }}
          onStepChange={(_event, currentStep) => {
            const stepId = String(currentStep.id);
            if (stepId === "monitoring-finish" && deployPhase === "idle") {
              setDeployPhase("running");
            }
            if (stepId === "monitoring-finish") {
              setDisableNav(deployPhase !== "done");
              return;
            }
            setDisableNav(false);
          }}
          header={
            <div className="ct-monitoring-center-wizard__header">
              <div>
                <Title headingLevel="h1" size="2xl" className="ct-monitoring-center-wizard__title">
                  Wall 모니터링 구성 마법사
                </Title>
                <Content className="ct-monitoring-center-wizard__subtitle">
                  <Content component="p">ABLESTACK 클라우드센터 VM에 Wall 모니터링 구성합니다.</Content>
                </Content>
              </div>
              <button
                type="button"
                className="ct-monitoring-center-wizard__close"
                aria-label="Close"
                onClick={handleClose}
              >
                ×
              </button>
            </div>
          }
        >
          <WizardStep name="개요" id="monitoring-overview">
            <div className="ct-monitoring-center-wizard__content">
              <Content>
                <Content component="p">
                  ABLESTACK 클라우드센터 VM에 Wall 모니터링을 구성하기 위해 필요한 정보를 다음과 같이 마법사를 통해
                  입력받습니다.
                </Content>
                <Content component="ul">
                  <Content component="li">Wall 모니터링 수집 대상의 IP 정보</Content>
                  <Content component="li">알림 서비스를 위한 SMTP 설정 정보</Content>
                </Content>
                <Content component="p">
                  필요한 정보를 먼저 준비하십시오. 정보가 준비되었다면 "다음" 버튼을 눌러 Wall 모니터링 구성을
                  시작합니다.
                  <br />(현재 버전에서는 TLS를 지원하지 않습니다.)
                </Content>
              </Content>
            </div>
          </WizardStep>

          <WizardStep name="모니터링 대상 IP 설정" id="monitoring-ip">
            <div className="ct-monitoring-center-wizard__content">
              <Content>
                <Content component="p">
                  ABLESTACK 클러스터의 구성 요소인 Cube 호스트, 클라우드센터 VM, 스토리지센터 VM을 모니터링하기 위해
                  아래 정보를 입력하십시오. (호스트 수가 변경될 경우 입력한 값이 초기화됩니다.)
                </Content>
              </Content>
              <Form className="ct-monitoring-center-wizard__section ct-monitoring-center-wizard__form-horizontal" isHorizontal>
                <FormGroup label="호스트 수" isRequired fieldId="monitoring-host-count">
                  <TextInput
                    id="monitoring-host-count"
                    type="number"
                    value={hostCount}
                    onChange={(_event, value) => updateHostCount(String(value))}
                  />
                </FormGroup>

                <div className="ct-monitoring-center-wizard__field-group">
                  <div className="ct-monitoring-center-wizard__field-title">클라우드센터 VM</div>
                  <FormGroup label="CCVM 관리 IP" isRequired fieldId="monitoring-ccvm-ip">
                    <TextInput
                      id="monitoring-ccvm-ip"
                      value={ccvmIp}
                      onChange={(_event, value) => setCcvmIp(String(value))}
                    />
                  </FormGroup>
                </div>

                <div className="ct-monitoring-center-wizard__field-group">
                  <div className="ct-monitoring-center-wizard__field-title">Cube 호스트</div>
                  {cubeHosts.map((value, index) => (
                    <FormGroup
                      key={`cube-host-${index}`}
                      label={`Cube${index + 1} 관리 IP`}
                      isRequired
                      fieldId={`monitoring-cube-${index + 1}`}
                    >
                      <TextInput
                        id={`monitoring-cube-${index + 1}`}
                        value={value}
                        onChange={(_event, nextValue) => {
                          setCubeHosts((prev) => {
                            const next = [...prev];
                            next[index] = String(nextValue);
                            return next;
                          });
                        }}
                      />
                    </FormGroup>
                  ))}
                </div>

                <div className="ct-monitoring-center-wizard__field-group">
                  <div className="ct-monitoring-center-wizard__field-title">스토리지센터 VM</div>
                  {scvmHosts.map((value, index) => (
                    <FormGroup
                      key={`scvm-host-${index}`}
                      label={`SCVM${index + 1} 관리 IP`}
                      isRequired
                      fieldId={`monitoring-scvm-${index + 1}`}
                    >
                      <TextInput
                        id={`monitoring-scvm-${index + 1}`}
                        value={value}
                        onChange={(_event, nextValue) => {
                          setScvmHosts((prev) => {
                            const next = [...prev];
                            next[index] = String(nextValue);
                            return next;
                          });
                        }}
                      />
                    </FormGroup>
                  ))}
                </div>
              </Form>
              <Alert
                isInline
                title="IP 설정 시 참고사항"
                variant="info"
                icon={<InfoCircleIcon />}
                className="ct-monitoring-center-wizard__info"
              >
                <Content component="p">Cube 호스트, 클라우드센터 VM, 스토리지센터 VM의 관리 IP 정보를 입력하십시오.</Content>
              </Alert>
            </div>
          </WizardStep>

          <WizardStep name="알림 SMTP 설정" id="monitoring-smtp">
            <div className="ct-monitoring-center-wizard__content">
              <Content>
                <Content component="p">
                  Wall 모니터링 알림 서비스를 위해 SMTP 정보를 설정합니다. 아래의 항목에 적합한 값을 입력하십시오.
                </Content>
              </Content>
              <Form className="ct-monitoring-center-wizard__section ct-monitoring-center-wizard__form-horizontal" isHorizontal>
                <FormGroup label="SMTP 구성 여부" isRequired fieldId="monitoring-smtp-enabled">
                  <Checkbox
                    id="monitoring-smtp-enabled"
                    label="SMTP 구성 하기"
                    isChecked={smtpEnabled}
                    onChange={(_event, checked) => setSmtpEnabled(checked)}
                  />
                </FormGroup>
                <FormGroup label="SMTP 서버" isRequired fieldId="monitoring-smtp-server">
                  <TextInput
                    id="monitoring-smtp-server"
                    value={smtpServer}
                    isDisabled={!smtpEnabled}
                    onChange={(_event, value) => setSmtpServer(String(value))}
                  />
                </FormGroup>
                <FormGroup label="SMTP Port" isRequired fieldId="monitoring-smtp-port">
                  <TextInput
                    id="monitoring-smtp-port"
                    value={smtpPort}
                    isDisabled={!smtpEnabled}
                    onChange={(_event, value) => setSmtpPort(String(value))}
                  />
                </FormGroup>
                <FormGroup label="관리자 이메일 주소" isRequired fieldId="monitoring-smtp-email">
                  <TextInput
                    id="monitoring-smtp-email"
                    value={smtpEmail}
                    isDisabled={!smtpEnabled}
                    onChange={(_event, value) => setSmtpEmail(String(value))}
                  />
                </FormGroup>
                <FormGroup label="이메일 비밀번호" isRequired fieldId="monitoring-smtp-password">
                  <TextInput
                    id="monitoring-smtp-password"
                    type="password"
                    value={smtpPassword}
                    isDisabled={!smtpEnabled}
                    onChange={(_event, value) => setSmtpPassword(String(value))}
                  />
                </FormGroup>
                <FormGroup label="수신 이메일 주소" fieldId="monitoring-smtp-receivers">
                  <div>
                    <TextInput
                      id="monitoring-smtp-receivers"
                      value={smtpReceivers}
                      isDisabled={!smtpEnabled}
                      onChange={(_event, value) => setSmtpReceivers(String(value))}
                    />
                    <div className="ct-monitoring-center-wizard__helper-text">
                      ( ";" 분기리호를 사용하여 여러 이메일 주소를 입력할 수 있습니다. )
                    </div>
                  </div>
                </FormGroup>
              </Form>
              <Alert
                isInline
                title="알림 SMTP 구성 시 참고사항"
                variant="info"
                icon={<InfoCircleIcon />}
                className="ct-monitoring-center-wizard__info"
              >
                <Content component="p">
                  SMTP 설정은 선택사항입니다. 현재 SMTP를 설정하지 않아도 Wall 모니터링 구성 후 Wall 모니터링센터에서
                  수동으로 구성 가능합니다. SMTP 구성 작업 후 Wall 대시보드에 접속하여 "경고 &gt; 콘택트 포인트" 메뉴에서
                  수신받을 이메일 정보를 입력해주세요.
                </Content>
              </Alert>
            </div>
          </WizardStep>

          <WizardStep name="설정확인" id="monitoring-review">
            <div className="ct-monitoring-center-wizard__content">
              <Content>
                <Content component="p">
                  Wall 모니터링센터 구성을 위해 입력한 설정 정보는 다음과 같습니다. 입력한 정보를 수정하고자 하는 경우,
                  해당 탭으로 이동하여 정보를 수정하십시오.
                </Content>
                <Content component="p">모든 정보를 확인한 후 "구성"을 시작합니다.</Content>
              </Content>
              <div className="ct-monitoring-center-wizard__review-accordion">
                <div className="ct-monitoring-center-wizard__review-section">
                  <button
                    type="button"
                    className="ct-monitoring-center-wizard__review-header"
                    onClick={() => setReviewOpen((prev) => ({ ...prev, ip: !prev.ip }))}
                  >
                    <span>모니터링 대상 IP 설정</span>
                    <span className={reviewOpen.ip ? "ct-monitoring-chevron ct-monitoring-chevron--open" : "ct-monitoring-chevron"}>
                      <AngleRightIcon aria-hidden="true" />
                    </span>
                  </button>
                  {reviewOpen.ip && (
                    <div className="ct-monitoring-center-wizard__review-body">
                      <DescriptionList isHorizontal className="ct-monitoring-center-wizard__review-detail">
                        <DescriptionListGroup>
                          <DescriptionListTerm>호스트 수</DescriptionListTerm>
                          <DescriptionListDescription>{hostCount} 대</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>클라우드센터 VM</DescriptionListTerm>
                          <DescriptionListDescription>CCVM 관리 IP: {ccvmIp || "미입력"}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Cube 호스트</DescriptionListTerm>
                          <DescriptionListDescription>
                            {cubeHosts.map((value, index) => (
                              <div key={`review-cube-${index}`}>Cube{index + 1} 관리 IP: {value || "미입력"}</div>
                            ))}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>스토리지센터 VM</DescriptionListTerm>
                          <DescriptionListDescription>
                            {scvmHosts.map((value, index) => (
                              <div key={`review-scvm-${index}`}>SCVM{index + 1} 관리 IP: {value || "미입력"}</div>
                            ))}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </div>
                  )}
                </div>

                <div className="ct-monitoring-center-wizard__review-section">
                  <button
                    type="button"
                    className="ct-monitoring-center-wizard__review-header"
                    onClick={() => setReviewOpen((prev) => ({ ...prev, smtp: !prev.smtp }))}
                  >
                    <span>알림 SMTP 설정</span>
                    <span className={reviewOpen.smtp ? "ct-monitoring-chevron ct-monitoring-chevron--open" : "ct-monitoring-chevron"}>
                      <AngleRightIcon aria-hidden="true" />
                    </span>
                  </button>
                  {reviewOpen.smtp && (
                    <div className="ct-monitoring-center-wizard__review-body">
                      <DescriptionList isHorizontal className="ct-monitoring-center-wizard__review-detail">
                        <DescriptionListGroup>
                          <DescriptionListTerm>SMTP 구성 여부</DescriptionListTerm>
                          <DescriptionListDescription>{smtpEnabledLabel}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>SMTP 서버</DescriptionListTerm>
                          <DescriptionListDescription>{smtpServer || "미입력"}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>SMTP Port</DescriptionListTerm>
                          <DescriptionListDescription>{smtpPort || "미입력"}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>관리자 이메일 주소</DescriptionListTerm>
                          <DescriptionListDescription>{smtpEmail || "미입력"}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>이메일 비밀번호</DescriptionListTerm>
                          <DescriptionListDescription>{smtpPassword ? "●●●●●●" : "미입력"}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>수신 이메일 주소</DescriptionListTerm>
                          <DescriptionListDescription>{smtpReceivers || "미입력"}</DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </WizardStep>

          <WizardStep name="완료" id="monitoring-finish">
            <div className="ct-monitoring-center-wizard__content">
              {deployPhase === "running" ? (
                <>
                  <Content component="p" className="ct-monitoring-center-wizard__deploy-title">
                    Wall 모니터링센터를 구성 중입니다. 전체 3단계 중 2단계 진행 중입니다.
                  </Content>
                  <div className="ct-monitoring-center-wizard__status-list">
                    <div>
                      <Label color="green">완료됨</Label>
                      <span>Wall 구성 HOST 네트워크 연결 테스트</span>
                    </div>
                    <div>
                      <Label color="orange">진행중</Label>
                      <span>모니터링 대상 IP 설정</span>
                    </div>
                    <div>
                      <Label color="blue">준비중</Label>
                      <span>알림 SMTP 설정</span>
                    </div>
                  </div>
                </>
              ) : (
                <Content>
                  <Content component="p">Wall 모니터링센터 구성을 완료했습니다.</Content>
                  <Content component="ul">
                    <Content component="li">
                      Wall 모니터링센터를 통해 대시보드 서비스, 알람 서비스, 플레이리스트 등 작업을 수행할 수 있습니다.
                    </Content>
                    <Content component="li">관리자로 로그인 하신 후 보안을 위해 비밀번호를 변경해 주세요.</Content>
                  </Content>
                  <Content component="p">위의 모든 작업은 Wall 모니터링센터의 웹 관리콘솔을 이용해 진행합니다.</Content>
                </Content>
              )}
            </div>
          </WizardStep>
        </Wizard>
      </Modal>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-label="모니터링센터 대시보드 구성 진행"
        variant="small"
        title="모니터링센터 대시보드 구성 진행"
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
        <Content component="p">모니터링센터 대시보드 구성을 진행하시겠습니까?</Content>
      </Modal>
    </>
  );
}
