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
  TextArea,
  FileUpload,
  Button,
  Label,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from "@patternfly/react-core";
import { CheckCircleIcon, InfoCircleIcon } from "@patternfly/react-icons";

import "./cluster-config-prepare-wizard.scss";

type ClusterType = "ablestack-hci" | "ablestack-powerflex" | "ablestack-vm";
type RadioValue = "new" | "existing";
type HostMode = "new" | "add";
type TimeServerType = "local" | "external";
type HostRole = "master" | "second" | "other";

interface ClusterHostRow {
  hostName: string;
  hostIp: string;
  scvmMgmtIp: string;
  hostPnIp: string;
  scvmPnIp: string;
  scvmCnIp: string;
}

interface ClusterConfigPrepareWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_HOSTS: ClusterHostRow[] = [
  {
    hostName: "ablecube32-1",
    hostIp: "10.10.32.1",
    scvmMgmtIp: "10.10.32.11",
    hostPnIp: "100.100.32.1",
    scvmPnIp: "100.100.32.11",
    scvmCnIp: "100.200.32.11",
  },
  {
    hostName: "ablecube32-2",
    hostIp: "10.10.32.2",
    scvmMgmtIp: "10.10.32.12",
    hostPnIp: "100.100.32.2",
    scvmPnIp: "100.100.32.12",
    scvmCnIp: "100.200.32.12",
  },
  {
    hostName: "ablecube32-3",
    hostIp: "10.10.32.3",
    scvmMgmtIp: "10.10.32.13",
    hostPnIp: "100.100.32.3",
    scvmPnIp: "100.100.32.13",
    scvmCnIp: "100.200.32.13",
  },
];

export default function ClusterConfigPrepareWizardModal({
  isOpen,
  onClose,
}: ClusterConfigPrepareWizardModalProps) {
  const [clusterType, setClusterType] = React.useState<ClusterType>("ablestack-hci");
  const [sshKeyMode, setSshKeyMode] = React.useState<RadioValue>("new");
  const [clusterHostMode, setClusterHostMode] = React.useState<HostMode>("new");
  const [hostsFileMode, setHostsFileMode] = React.useState<RadioValue>("new");
  const [hosts, setHosts] = React.useState<ClusterHostRow[]>(DEFAULT_HOSTS);
  const [hostCount, setHostCount] = React.useState(3);
  const [currentHostname, setCurrentHostname] = React.useState("ablecube32-1");
  const [ccvmMgmtIp, setCcvmMgmtIp] = React.useState("10.10.32.10");
  const [mgmtCidr, setMgmtCidr] = React.useState("16");
  const [mgmtGateway, setMgmtGateway] = React.useState("10.10.0.1");
  const [mgmtDns, setMgmtDns] = React.useState("8.8.8.8");
  const [pcsPnIp1, setPcsPnIp1] = React.useState("100.100.32.1");
  const [pcsPnIp2, setPcsPnIp2] = React.useState("100.100.32.2");
  const [pcsPnIp3, setPcsPnIp3] = React.useState("100.100.32.3");
  const [hostsFileText, setHostsFileText] = React.useState("");
  const [sshPrivateFilename, setSshPrivateFilename] = React.useState("");
  const [sshPublicFilename, setSshPublicFilename] = React.useState("");
  const [hostsFilename, setHostsFilename] = React.useState("");
  const [timeServerType, setTimeServerType] = React.useState<TimeServerType>("local");
  const [hostRole, setHostRole] = React.useState<HostRole>("master");
  const [externalTimeServer, setExternalTimeServer] = React.useState("time.google.com");
  const [timeServer1, setTimeServer1] = React.useState("100.100.33.1");
  const [timeServer2, setTimeServer2] = React.useState("100.100.33.2");
  const [reviewOpen, setReviewOpen] = React.useState({
    clusterType: true,
    sshKey: true,
    clusterConfig: true,
    timeServer: true,
  });

  const resetState = React.useCallback(() => {
    setClusterType("ablestack-hci");
    setSshKeyMode("new");
    setClusterHostMode("new");
    setHostsFileMode("new");
    setHosts(DEFAULT_HOSTS);
    setHostCount(3);
    setCurrentHostname("ablecube32-1");
    setCcvmMgmtIp("10.10.32.10");
    setMgmtCidr("16");
    setMgmtGateway("10.10.0.1");
    setMgmtDns("8.8.8.8");
    setPcsPnIp1("100.100.32.1");
    setPcsPnIp2("100.100.32.2");
    setPcsPnIp3("100.100.32.3");
    setHostsFileText("");
    setSshPrivateFilename("");
    setSshPublicFilename("");
    setHostsFilename("");
    setTimeServerType("local");
    setHostRole("master");
    setExternalTimeServer("time.google.com");
    setTimeServer1("100.100.33.1");
    setTimeServer2("100.100.33.2");
  }, []);

  const handleClose = () => {
    onClose();
    resetState();
  };

  const updateHostCount = (nextCount: number) => {
    const safeCount = Math.max(1, Math.min(9, nextCount));
    setHostCount(safeCount);
    setHosts((prev) => {
      if (safeCount === prev.length) return prev;
      if (safeCount < prev.length) return prev.slice(0, safeCount);
      const extras = Array.from({ length: safeCount - prev.length }, (_, idx) => ({
        hostName: `ablecube32-${prev.length + idx + 1}`,
        hostIp: "",
        scvmMgmtIp: "",
        hostPnIp: "",
        scvmPnIp: "",
        scvmCnIp: "",
      }));
      return [...prev, ...extras];
    });
  };

  const renderClusterTypeCard = (
    value: ClusterType,
    title: string,
    description: string
  ) => (
    <button
      type="button"
      className={
        clusterType === value
          ? "ct-cluster-config-wizard__type-card ct-cluster-config-wizard__type-card--active"
          : "ct-cluster-config-wizard__type-card"
      }
      onClick={() => setClusterType(value)}
    >
      <div className="ct-cluster-config-wizard__type-card-title">{title}</div>
      <div className="ct-cluster-config-wizard__type-card-desc">{description}</div>
      {clusterType === value && (
        <div className="ct-cluster-config-wizard__type-card-check">
          <CheckCircleIcon aria-hidden="true" />
        </div>
      )}
    </button>
  );

  const clusterTypeLabel =
    clusterType === "ablestack-hci"
      ? "ABLESTACK-HCI"
      : clusterType === "ablestack-powerflex"
        ? "ABLESTACK-PowerFlex"
        : "ABLESTACK-VM";

  const sshKeyModeLabel = sshKeyMode === "new" ? "신규 생성" : "기존 파일 사용";
  const hostsFileModeLabel = hostsFileMode === "new" ? "신규 생성" : "기존 파일 사용";
  const timeServerTypeLabel = timeServerType === "local" ? "로컬 시간서버" : "외부 시간서버";
  const hostRoleLabel =
    hostRole === "master" ? "Master Server" : hostRole === "second" ? "Second Server" : "Other Server";

  const buildHostsPreview = () => {
    if (hostsFileText.trim()) return hostsFileText;
    const lines: string[] = [];
    lines.push(`${ccvmMgmtIp} ccvm-mngt ccvm`);
    hosts.forEach((row) => {
      lines.push(`${row.hostIp} ${row.hostName}`);
      lines.push(`${row.scvmMgmtIp} scvm-mngt scvm-${row.hostName}`);
      lines.push(`${row.hostPnIp} pn-${row.hostName}`);
      lines.push(`${row.scvmPnIp} pn-scvm`);
      lines.push(`${row.scvmCnIp} cn-scvm`);
    });
    return lines.join("\n");
  };

  const wizardFooter = (activeStep: any, goToNextStep: () => void, goToPrevStep: () => void, close: () => void) => {
    if (!activeStep) return null;
    const stepId = String(activeStep.id);
    const isFirst = stepId === "cluster-config-overview";
    const isReview = stepId === "cluster-config-review";
    const isFinish = stepId === "cluster-config-finish";
    return (
      <div className="ct-cluster-config-wizard__footer">
        {!isFinish && (
          <Button variant="primary" onClick={goToNextStep}>
            {isReview ? "완료" : "다음"}
          </Button>
        )}
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
        {isFinish && (
          <Button variant="primary" onClick={close}>
            닫기
          </Button>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      // onClose={handleClose}
      variant="large"
      aria-label="클러스터 구성 준비 마법사"
      className="ct-cluster-config-wizard__modal"
    >
      <Wizard
        onClose={handleClose}
        onSave={handleClose}
        height="74vh"
        width="100%"
        navAriaLabel="클러스터 구성 준비 단계"
        className="ct-cluster-config-wizard"
        footer={wizardFooter}
        header={
          <div className="ct-cluster-config-wizard__header">
            <div>
              <Title headingLevel="h1" size="2xl" className="ct-cluster-config-wizard__title">
                클러스터 구성 준비 마법사
              </Title>
            <Content className="ct-cluster-config-wizard__subtitle">
              <Content component="p">
                스토리지센터 및 클라우드센터 클러스터를 구성하기 위해 필요한 다양한 정보 및 구성파일을 준비합니다.
              </Content>
            </Content>
            </div>
            <button
              type="button"
              className="ct-cluster-config-wizard__close"
              aria-label="Close"
              onClick={handleClose}
            >
              ×
            </button>
          </div>
        }
      >
        <WizardStep name="개요" id="cluster-config-overview">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                클러스터 구성 준비 마법사는 클러스터를 자동으로 구성하고, 스토리지센터 및 클라우드센터를 구성하기 위해 필요한 다음의 정보를 입력받아 준비합니다.
              </Content>
              <Content component="ul">
                <Content component="li">HCI를 이용한 가상화 또는 일반 가상화를 위한 클러스터</Content>
                <Content component="li">모든 호스트 및 가상머신에서 공통으로 사용할 SSH Key 정보</Content>
                <Content component="li">클러스터를 구성하는 호스트 및 가상머신의 호스트명 및 IP 정보</Content>
                <Content component="li">호스트 및 가상머신의 시간 동기화를 위한 시간서버</Content>
              </Content>
              <Content component="p">
                필요한 정보를 먼저 준비하십시오. 정보가 준비되었다면 "다음" 버튼을 눌러 클러스터 구성
                준비를 시작합니다.
              </Content>
            </Content>
          </div>
        </WizardStep>

        <WizardStep name="클러스터 종류" id="cluster-config-cluster-type">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                ABLESTACK은 고성능 컴퓨팅과 안정적인 가상화 환경을 제공합니다. 사용자는 하이퍼 컨버지드
                인프라(HCI)와 전통적인 가상화 옵션 중에서 필요에 맞는 솔루션을 선택할 수 있습니다.
              </Content>
              <Content component="ul">
                <Content component="li">
                  ABLESTACK HCI는 데이터의 안정적이고 효율적인 관리를 위해 설계되었습니다. Glue 스토리지는
                  데이터를 여러 위치에 분산시켜 저장하여 높은 가용성과 확장성을 제공합니다.
                </Content>
                <Content component="li">
                  ABLESTACK PowerFlex는 Dell의 블록 스토리지 고성능 처리 및 안정성을 제공합니다.
                </Content>
                <Content component="li">
                  ABLESTACK VM은 물리적 하드웨어를 추상화하여 여러 VM에서 동시 실행이 가능하게 하며,
                  다양한 운영 체제와 애플리케이션을 구동할 수 있습니다.
                </Content>
              </Content>
            </Content>
            <div className="ct-cluster-config-wizard__type-grid">
              {renderClusterTypeCard(
                "ablestack-hci",
                "ABLESTACK-HCI",
                "x86 기반의 서버와 가상화 기술, 그리고 소프트웨어 정의 기술을 접목하여 HCI를 구성하는 소프트웨어 스택입니다."
              )}
              {renderClusterTypeCard(
                "ablestack-powerflex",
                "ABLESTACK-PowerFlex",
                "단일 시스템으로 배포, 관리 및 지원되는 엔터프라이즈 스토리지 정의 블록 및 파일 스토리지 솔루션입니다."
              )}
              {renderClusterTypeCard(
                "ablestack-vm",
                "ABLESTACK-VM",
                "Cube 및 외부 스토리지를 사용하여 Mold를 ABLESTACK VM으로 올린 소프트웨어 솔루션입니다."
              )}
            </div>
          </div>
        </WizardStep>

        <WizardStep name="SSH Key 파일" id="cluster-config-ssh-key">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                클러스터를 구성하는 호스트 및 가상머신은 모든 명령을 SSH를 이용해 암호화 하여 전달합니다.
                원활한 SSH 연결 및 상호 인증을 위해 동일한 SSH Key 설정이 필요합니다.
              </Content>
            </Content>
            <Form className="ct-cluster-config-wizard__section ct-cluster-config-wizard__form-horizontal" isHorizontal>
              <FormGroup label="SSH Key 준비 방법" isRequired fieldId="ssh-key-mode">
                <div className="ct-cluster-config-wizard__inline">
                  <Radio
                    id="ssh-key-new"
                    name="ssh-key-mode"
                    label="신규 생성"
                    isChecked={sshKeyMode === "new"}
                    onChange={() => setSshKeyMode("new")}
                  />
                  <Radio
                    id="ssh-key-existing"
                    name="ssh-key-mode"
                    label="기존 파일 사용"
                    isChecked={sshKeyMode === "existing"}
                    onChange={() => setSshKeyMode("existing")}
                  />
                </div>
              </FormGroup>
              <FormGroup label="SSH 개인 키 파일" isRequired fieldId="ssh-private-key">
                <FileUpload
                  id="ssh-private-key-file"
                  type="text"
                  value=""
                  filename={sshPrivateFilename}
                  filenamePlaceholder="선택된 파일 없음"
                  onFileInputChange={(_, file) => setSshPrivateFilename(file.name)}
                  isDisabled={sshKeyMode === "new"}
                  hideDefaultPreview
                />
              </FormGroup>
              <FormGroup label="SSH 공개 키 파일" isRequired fieldId="ssh-public-key">
                <FileUpload
                  id="ssh-public-key-file"
                  type="text"
                  value=""
                  filename={sshPublicFilename}
                  filenamePlaceholder="선택된 파일 없음"
                  onFileInputChange={(_, file) => setSshPublicFilename(file.name)}
                  isDisabled={sshKeyMode === "new"}
                  hideDefaultPreview
                />
              </FormGroup>
            </Form>
          </div>
        </WizardStep>

        <WizardStep name="클러스터 구성 파일" id="cluster-config-ip-info">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                클러스터를 구성하는 호스트 및 가상머신에 대한 호스트명과 IP 정보를 미리 정의해야 합니다.
              </Content>
            </Content>
            <Form className="ct-cluster-config-wizard__section ct-cluster-config-wizard__form-horizontal" isHorizontal>
              <FormGroup label="클러스터 호스트 구분" isRequired fieldId="cluster-host-mode">
                <div className="ct-cluster-config-wizard__inline">
                  <Radio
                    id="cluster-host-new"
                    name="cluster-host-mode"
                    label="신규 클러스터 호스트"
                    isChecked={clusterHostMode === "new"}
                    onChange={() => setClusterHostMode("new")}
                  />
                  <Radio
                    id="cluster-host-add"
                    name="cluster-host-mode"
                    label="추가 호스트"
                    isChecked={clusterHostMode === "add"}
                    onChange={() => setClusterHostMode("add")}
                  />
                </div>
              </FormGroup>
              <FormGroup label="클러스터 구성 파일 준비" isRequired fieldId="hosts-file-mode">
                <div className="ct-cluster-config-wizard__inline">
                  <Radio
                    id="hosts-file-new"
                    name="hosts-file-mode"
                    label="신규 생성"
                    isChecked={hostsFileMode === "new"}
                    onChange={() => setHostsFileMode("new")}
                  />
                  <Radio
                    id="hosts-file-existing"
                    name="hosts-file-mode"
                    label="기존 파일 사용"
                    isChecked={hostsFileMode === "existing"}
                    onChange={() => setHostsFileMode("existing")}
                  />
                </div>
              </FormGroup>

              <FormGroup label="현재 호스트명" isRequired fieldId="current-hostname">
                <TextInput
                  id="current-hostname"
                  value={currentHostname}
                  onChange={(_event, value) => setCurrentHostname(value)}
                  isReadOnly
                />
              </FormGroup>

              <FormGroup label="구성할 호스트 수" isRequired fieldId="host-count">
                <div className="ct-cluster-config-wizard__stepper">
                  <Button variant="control" onClick={() => updateHostCount(hostCount - 1)}>
                    -
                  </Button>
                  <div className="ct-cluster-config-wizard__stepper-value">{hostCount}</div>
                  <Button variant="control" onClick={() => updateHostCount(hostCount + 1)}>
                    +
                  </Button>
                  <span className="ct-cluster-config-wizard__stepper-unit">대</span>
                </div>
              </FormGroup>

              <div className="ct-cluster-config-wizard__table-wrap">
                <div className="ct-cluster-config-wizard__table-title">클러스터 구성 프로파일</div>
                <table className="ct-cluster-config-wizard__table">
                  <thead>
                    <tr>
                      <th>idx</th>
                      <th>호스트명</th>
                      <th>호스트 IP</th>
                      <th>SCVM MNGT IP</th>
                      <th>호스트 PN IP</th>
                      <th>SCVM PN IP</th>
                      <th>SCVM CN IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hosts.map((row, idx) => (
                      <tr key={`${row.hostName}-${idx}`}>
                        <td>{idx + 1}</td>
                        <td>{row.hostName}</td>
                        <td>{row.hostIp}</td>
                        <td>{row.scvmMgmtIp}</td>
                        <td>{row.hostPnIp}</td>
                        <td>{row.scvmPnIp}</td>
                        <td>{row.scvmCnIp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <FormGroup label="CCVM 관리 IP" isRequired fieldId="ccvm-ip">
                <TextInput id="ccvm-ip" value={ccvmMgmtIp} onChange={(_event, value) => setCcvmMgmtIp(value)} />
              </FormGroup>
              <FormGroup label="관리 NIC CIDR" fieldId="mgmt-cidr">
                <TextInput id="mgmt-cidr" value={mgmtCidr} onChange={(_event, value) => setMgmtCidr(value)} />
              </FormGroup>
              <FormGroup label="관리 NIC Gateway" fieldId="mgmt-gw">
                <TextInput id="mgmt-gw" value={mgmtGateway} onChange={(_event, value) => setMgmtGateway(value)} />
              </FormGroup>
              <FormGroup label="관리 NIC DNS" fieldId="mgmt-dns">
                <TextInput id="mgmt-dns" value={mgmtDns} onChange={(_event, value) => setMgmtDns(value)} />
              </FormGroup>
              <FormGroup label="PCS 호스트 PN IP #1" isRequired fieldId="pcs-pn-1">
                <TextInput id="pcs-pn-1" value={pcsPnIp1} onChange={(_event, value) => setPcsPnIp1(value)} />
              </FormGroup>
              <FormGroup label="PCS 호스트 PN IP #2" fieldId="pcs-pn-2">
                <TextInput id="pcs-pn-2" value={pcsPnIp2} onChange={(_event, value) => setPcsPnIp2(value)} />
              </FormGroup>
              <FormGroup label="PCS 호스트 PN IP #3" isRequired fieldId="pcs-pn-3">
                <TextInput id="pcs-pn-3" value={pcsPnIp3} onChange={(_event, value) => setPcsPnIp3(value)} />
              </FormGroup>

              {hostsFileMode === "existing" ? (
                <FormGroup label="클러스터 구성 파일" isRequired fieldId="hosts-file">
                  <FileUpload
                    id="hosts-file-upload"
                    type="text"
                    value=""
                    filename={hostsFilename}
                    filenamePlaceholder="선택된 파일 없음"
                    onFileInputChange={(_, file) => setHostsFilename(file.name)}
                  />
                </FormGroup>
              ) : (
                <FormGroup label="클러스터 구성 파일" fieldId="hosts-file-text">
                  <TextArea
                    id="hosts-file-text"
                    value={hostsFileText}
                    onChange={(_event, value) => setHostsFileText(value)}
                    resizeOrientation="vertical"
                    rows={4}
                    placeholder="예) 10.10.0.11 ablecube32-1"
                  />
                </FormGroup>
              )}
            </Form>
          </div>
        </WizardStep>

        <WizardStep name="시간서버" id="cluster-config-time-server">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                스토리지의 무결성과 가용성을 높이기 위해서 호스트 및 가상머신의 시간 동기화는 필수입니다.
              </Content>
            </Content>
            <Form className="ct-cluster-config-wizard__section ct-cluster-config-wizard__form-horizontal" isHorizontal>
              <FormGroup label="시간서버 종류" isRequired fieldId="time-server-type">
                <div className="ct-cluster-config-wizard__inline">
                  <Radio
                    id="time-server-local"
                    name="time-server-type"
                    label="로컬 시간서버"
                    isChecked={timeServerType === "local"}
                    onChange={() => setTimeServerType("local")}
                  />
                  <Radio
                    id="time-server-external"
                    name="time-server-type"
                    label="외부 시간서버"
                    isChecked={timeServerType === "external"}
                    onChange={() => setTimeServerType("external")}
                  />
                </div>
              </FormGroup>
              <FormGroup label="현재 Host" isRequired fieldId="host-role">
                <div className="ct-cluster-config-wizard__inline">
                  <Radio
                    id="host-role-master"
                    name="host-role"
                    label="Master Server"
                    isChecked={hostRole === "master"}
                    onChange={() => setHostRole("master")}
                  />
                  <Radio
                    id="host-role-second"
                    name="host-role"
                    label="Second Server"
                    isChecked={hostRole === "second"}
                    onChange={() => setHostRole("second")}
                  />
                  <Radio
                    id="host-role-other"
                    name="host-role"
                    label="Other Server"
                    isChecked={hostRole === "other"}
                    onChange={() => setHostRole("other")}
                  />
                </div>
              </FormGroup>
              <FormGroup label="외부 시간서버" fieldId="external-time-server">
                <TextInput
                  id="external-time-server"
                  value={externalTimeServer}
                  onChange={(_event, value) => setExternalTimeServer(value)}
                />
              </FormGroup>
              <FormGroup label="시간서버 #1" isRequired fieldId="time-server-1">
                <TextInput id="time-server-1" value={timeServer1} onChange={(_event, value) => setTimeServer1(value)} />
              </FormGroup>
              <FormGroup label="시간서버 #2" fieldId="time-server-2">
                <TextInput id="time-server-2" value={timeServer2} onChange={(_event, value) => setTimeServer2(value)} />
              </FormGroup>
              <div className="ct-cluster-config-wizard__info">
                <InfoCircleIcon aria-hidden="true" />
                <div>
                  <div className="ct-cluster-config-wizard__info-title">시간서버 구성시 참고사항</div>
                  <div>구성할 호스트의 수가 3대 미만인 경우 로컬 시간서버 기능이 비활성화 됩니다.</div>
                </div>
              </div>
            </Form>
          </div>
        </WizardStep>

        <WizardStep name="설정확인" id="cluster-config-review">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                클러스터 구성을 위해 설정한 SSH Key, 호스트 프로파일, 시간 동기화 서버 정보는 다음과 같습니다.
              </Content>
            </Content>
            <div className="ct-cluster-config-wizard__review-accordion">
              <div className="ct-cluster-config-wizard__review-section">
                <button
                  type="button"
                  className="ct-cluster-config-wizard__review-header"
                  onClick={() =>
                    setReviewOpen((prev) => ({ ...prev, clusterType: !prev.clusterType }))
                  }
                >
                  <span>클러스터 종류</span>
                  <span className={reviewOpen.clusterType ? "ct-chevron ct-chevron--open" : "ct-chevron"}>▾</span>
                </button>
                {reviewOpen.clusterType && (
                  <div className="ct-cluster-config-wizard__review-body">
                    <DescriptionList isCompact className="ct-cluster-config-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 종류</DescriptionListTerm>
                        <DescriptionListDescription>{clusterTypeLabel}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-cluster-config-wizard__review-section">
                <button
                  type="button"
                  className="ct-cluster-config-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, sshKey: !prev.sshKey }))}
                >
                  <span>SSH Key 파일</span>
                  <span className={reviewOpen.sshKey ? "ct-chevron ct-chevron--open" : "ct-chevron"}>▾</span>
                </button>
                {reviewOpen.sshKey && (
                  <div className="ct-cluster-config-wizard__review-body">
                    <DescriptionList isCompact className="ct-cluster-config-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>SSH Key 준비 방법</DescriptionListTerm>
                        <DescriptionListDescription>{sshKeyModeLabel}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Private Key 내용</DescriptionListTerm>
                        <DescriptionListDescription>
                          <TextArea
                            readOnly
                            value={sshPrivateFilename || ""}
                            rows={6}
                            className="ct-cluster-config-wizard__review-textarea"
                          />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Public Key 내용</DescriptionListTerm>
                        <DescriptionListDescription>
                          <TextArea
                            readOnly
                            value={sshPublicFilename || ""}
                            rows={6}
                            className="ct-cluster-config-wizard__review-textarea"
                          />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-cluster-config-wizard__review-section">
                <button
                  type="button"
                  className="ct-cluster-config-wizard__review-header"
                  onClick={() =>
                    setReviewOpen((prev) => ({ ...prev, clusterConfig: !prev.clusterConfig }))
                  }
                >
                  <span>클러스터 구성 파일</span>
                  <span className={reviewOpen.clusterConfig ? "ct-chevron ct-chevron--open" : "ct-chevron"}>▾</span>
                </button>
                {reviewOpen.clusterConfig && (
                  <div className="ct-cluster-config-wizard__review-body">
                    <DescriptionList isCompact className="ct-cluster-config-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 구성 준비</DescriptionListTerm>
                        <DescriptionListDescription>{hostsFileModeLabel}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 구성 프로파일</DescriptionListTerm>
                        <DescriptionListDescription>
                          <TextArea
                            readOnly
                            value={buildHostsPreview()}
                            rows={6}
                            className="ct-cluster-config-wizard__review-textarea"
                          />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>CCVM 관리 IP</DescriptionListTerm>
                        <DescriptionListDescription>{ccvmMgmtIp}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>관리 NIC CIDR</DescriptionListTerm>
                        <DescriptionListDescription>{mgmtCidr}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>관리 NIC Gateway</DescriptionListTerm>
                        <DescriptionListDescription>{mgmtGateway}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>관리 NIC DNS</DescriptionListTerm>
                        <DescriptionListDescription>{mgmtDns}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>PCS 호스트 PN IP #1</DescriptionListTerm>
                        <DescriptionListDescription>{pcsPnIp1}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>PCS 호스트 PN IP #2</DescriptionListTerm>
                        <DescriptionListDescription>{pcsPnIp2}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>PCS 호스트 PN IP #3</DescriptionListTerm>
                        <DescriptionListDescription>{pcsPnIp3}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-cluster-config-wizard__review-section">
                <button
                  type="button"
                  className="ct-cluster-config-wizard__review-header"
                  onClick={() =>
                    setReviewOpen((prev) => ({ ...prev, timeServer: !prev.timeServer }))
                  }
                >
                  <span>시간서버</span>
                  <span className={reviewOpen.timeServer ? "ct-chevron ct-chevron--open" : "ct-chevron"}>▾</span>
                </button>
                {reviewOpen.timeServer && (
                  <div className="ct-cluster-config-wizard__review-body">
                    <DescriptionList isCompact className="ct-cluster-config-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>시간서버 종류</DescriptionListTerm>
                        <DescriptionListDescription>{timeServerTypeLabel}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>로컬 시간서버</DescriptionListTerm>
                        <DescriptionListDescription>{hostRoleLabel}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>외부 시간 서버</DescriptionListTerm>
                        <DescriptionListDescription>{externalTimeServer}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>시간서버 #1</DescriptionListTerm>
                        <DescriptionListDescription>{timeServer1}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>시간서버 #2</DescriptionListTerm>
                        <DescriptionListDescription>{timeServer2}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>
            </div>
          </div>
        </WizardStep>

        <WizardStep name="완료" id="cluster-config-finish">
          <div className="ct-cluster-config-wizard__content">
            <Content>
              <Content component="p">
                클러스터 구성 준비 중입니다. 전체 3단계 중 1단계 진행 중입니다.
              </Content>
            </Content>
            <div className="ct-cluster-config-wizard__status-list">
              <div>
                <Label color="orange" variant="outline">진행중</Label>
                <span>SSH Key File 생성</span>
              </div>
              <div>
                <Label color="blue" variant="outline">준비중</Label>
                <span>Cluster Config 및 Hosts 파일 생성</span>
              </div>
              <div>
                <Label color="blue" variant="outline">준비중</Label>
                <span>시간서버 설정 생성 및 마무리</span>
              </div>
            </div>
          </div>
        </WizardStep>
      </Wizard>
    </Modal>
  );
}
