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
  FormSelect,
  FormSelectOption,
  Button,
  Label,
  Spinner,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Alert,
} from "@patternfly/react-core";
import { InfoCircleIcon } from "@patternfly/react-icons";

import "./cloud-vm-deploy-wizard.scss";

type HostsFileMode = "existing" | "new";

interface ClusterHostRow {
  hostName: string;
  hostIp: string;
  ccvmMgmtIp: string;
  hostPnIp: string;
  hostCnIp: string;
}

interface CloudVmDeployWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_HOSTS: ClusterHostRow[] = [
  {
    hostName: "ablecube21",
    hostIp: "10.10.2.1",
    ccvmMgmtIp: "10.10.2.10",
    hostPnIp: "100.100.2.1",
    hostCnIp: "100.200.2.1",
  },
  {
    hostName: "ablecube22",
    hostIp: "10.10.2.2",
    ccvmMgmtIp: "10.10.2.10",
    hostPnIp: "100.100.2.2",
    hostCnIp: "100.200.2.2",
  },
  {
    hostName: "ablecube23",
    hostIp: "10.10.2.3",
    ccvmMgmtIp: "10.10.2.10",
    hostPnIp: "100.100.2.3",
    hostCnIp: "100.200.2.3",
  },
];

export default function CloudVmDeployWizardModal({
  isOpen,
  onClose,
}: CloudVmDeployWizardModalProps) {
  const [clusterSensitivity, setClusterSensitivity] = React.useState("5");
  const [cpu, setCpu] = React.useState("8");
  const [memory, setMemory] = React.useState("16");
  const [rootDisk] = React.useState("70 GiB (THIN Provisioning)");
  const [mgmtBridge, setMgmtBridge] = React.useState("bridge0 (connected)");
  const [svcEnabled, setSvcEnabled] = React.useState(false);
  const [svcBridge, setSvcBridge] = React.useState("bridge1 (connected)");

  const [hostsFileMode, setHostsFileMode] = React.useState<HostsFileMode>("existing");
  const [currentHostname] = React.useState("ablecube21");
  const [hostCount, setHostCount] = React.useState(3);
  const [hosts, setHosts] = React.useState<ClusterHostRow[]>(DEFAULT_HOSTS);

  const [ccvmHostname, setCcvmHostname] = React.useState("ccvm");
  const [mgmtIp, setMgmtIp] = React.useState("10.10.2.10/16");
  const [mgmtGateway, setMgmtGateway] = React.useState("10.10.0.1");
  const [mgmtDns, setMgmtDns] = React.useState("8.8.8.8");
  const [mgmtVlan, setMgmtVlan] = React.useState("");
  const [svcIp, setSvcIp] = React.useState("");
  const [svcGateway, setSvcGateway] = React.useState("");
  const [svcDns, setSvcDns] = React.useState("");
  const [svcVlan, setSvcVlan] = React.useState("");

  const [sshPrivateKey, setSshPrivateKey] = React.useState("");
  const [sshPublicKey, setSshPublicKey] = React.useState("");

  const [failoverMembers, setFailoverMembers] = React.useState(3);
  const [failoverHost1, setFailoverHost1] = React.useState("ablecube21");
  const [failoverHost2, setFailoverHost2] = React.useState("ablecube22");
  const [failoverHost3, setFailoverHost3] = React.useState("ablecube23");

  const [reviewOpen, setReviewOpen] = React.useState({
    appliance: true,
    additional: true,
    ssh: true,
    cluster: true,
  });
  const [disableNav, setDisableNav] = React.useState(false);

  const resetState = React.useCallback(() => {
    setClusterSensitivity("5");
    setCpu("8");
    setMemory("16");
    setMgmtBridge("bridge0 (connected)");
    setSvcEnabled(false);
    setSvcBridge("bridge1 (connected)");
    setHostsFileMode("existing");
    setHostCount(3);
    setHosts(DEFAULT_HOSTS);
    setCcvmHostname("ccvm");
    setMgmtIp("10.10.2.10/16");
    setMgmtGateway("10.10.0.1");
    setMgmtDns("8.8.8.8");
    setMgmtVlan("");
    setSvcIp("");
    setSvcGateway("");
    setSvcDns("");
    setSvcVlan("");
    setSshPrivateKey("");
    setSshPublicKey("");
    setFailoverMembers(3);
    setFailoverHost1("ablecube21");
    setFailoverHost2("ablecube22");
    setFailoverHost3("ablecube23");
    setReviewOpen({ appliance: true, additional: true, ssh: true, cluster: true });
    setDisableNav(false);
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
        hostName: `ablecube${prev.length + idx + 1}`,
        hostIp: "",
        ccvmMgmtIp: "",
        hostPnIp: "",
        hostCnIp: "",
      }));
      return [...prev, ...extras];
    });
  };

  const buildHostsPreview = () => {
    const lines: string[] = [];
    lines.push(`${mgmtIp.split("/")[0]} ccvm-mngt ccvm`);
    hosts.forEach((row) => {
      lines.push(`${row.hostIp} ${row.hostName}`);
      lines.push(`${row.hostPnIp} pn-${row.hostName}`);
      lines.push(`${row.hostCnIp} cn-${row.hostName}`);
    });
    return lines.join("\n");
  };

  const networkConfigLabel = svcEnabled ? "관리 + 서비스 네트워크" : "관리 네트워크";

  const wizardFooter = (
    activeStep: any,
    goToNextStep: () => void,
    goToPrevStep: () => void,
    close: () => void
  ) => {
    if (!activeStep) return null;
    const stepId = String(activeStep.id);
    const isFirst = stepId === "cloud-vm-overview";
    const isReview = stepId === "cloud-vm-review";
    const isFinish = stepId === "cloud-vm-finish";
    return (
      <div className="ct-cloud-vm-wizard__footer">
        {!isFinish && (
          <Button variant="primary" onClick={goToNextStep}>
            {isReview ? "배포" : "다음"}
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
      aria-label="클라우드센터 가상머신 배포 마법사"
      className="ct-cloud-vm-wizard__modal"
    >
      <Wizard
        onClose={handleClose}
        onSave={handleClose}
        height="74vh"
        width="100%"
        navAriaLabel="클라우드센터 가상머신 배포 단계"
        className={disableNav ? "ct-cloud-vm-wizard ct-cloud-vm-wizard--nav-locked" : "ct-cloud-vm-wizard"}
        footer={wizardFooter}
        navProps={{ "aria-disabled": disableNav }}
        onStepChange={(_event, currentStep) => {
          const stepId = String(currentStep.id);
          setDisableNav(stepId === "cloud-vm-finish");
        }}
        header={
          <div className="ct-cloud-vm-wizard__header">
            <div>
              <Title headingLevel="h1" size="2xl" className="ct-cloud-vm-wizard__title">
                ABLESTACK 클라우드센터 VM 배포 마법사
              </Title>
              <Content className="ct-cloud-vm-wizard__subtitle">
                <Content component="p">
                  ABLESTACK 클러스터에 클라우드센터를 실행하는 가상머신 어플라이언스를 배포합니다.
                </Content>
              </Content>
            </div>
            <button type="button" className="ct-cloud-vm-wizard__close" aria-label="Close" onClick={handleClose}>
              ×
            </button>
          </div>
        }
      >
        <WizardStep name="개요" id="cloud-vm-overview">
          <div className="ct-cloud-vm-wizard__content">
            <Content>
              <Content component="p">
                클라우드센터 VM을 배포하기 위해 필요한 정보를 다음과 같이 마법사를 통해 입력받습니다.
              </Content>
              <Content component="ul">
                <Content component="li">클라우드센터 VM의 HA구성을 위한 클러스터 설정 정보</Content>
                <Content component="li">클라우드센터 VM의 CPU, Memory, Disk, Network에 대한 정보</Content>
                <Content component="li">가상머신의 호스트명 등의 네트워크 정보</Content>
                <Content component="li">호스트 및 가상머신 간의 상호 SSH 연결을 위한 SSH Key 정보</Content>
              </Content>
              <Content component="p">
                필요한 정보를 먼저 준비하십시오. 정보가 준비되었다면 "다음" 버튼을 눌러 클라우드센터 VM 배포를 시작합니다.
              </Content>
            </Content>
          </div>
        </WizardStep>

        <WizardStep
          name="클라우드센터 VM 설정"
          id="cloud-vm-appliance"
          steps={[
            <WizardStep name="컴퓨트" id="cloud-vm-compute" key="cloud-vm-compute">
              <div className="ct-cloud-vm-wizard__content">
                <Content>
                  <Content component="p">
                    클라우드센터 VM의 CPU 및 Memory, ROOT Disk 등의 정보를 설정합니다.
                    아래의 항목에 적합한 값을 선택하여 입력하십시오.
                  </Content>
                </Content>
                <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
                  <FormGroup label="클러스터 민감도(초)" isRequired fieldId="cloud-vm-sensitivity">
                    <TextInput
                      id="cloud-vm-sensitivity"
                      type="number"
                      value={clusterSensitivity}
                      onChange={(_event, value) => setClusterSensitivity(String(value))}
                    />
                  </FormGroup>
                  <FormGroup label="CPU Core" isRequired fieldId="cloud-vm-cpu">
                    <FormSelect id="cloud-vm-cpu" value={cpu} onChange={(_event, value) => setCpu(String(value))}>
                      <FormSelectOption value="8" label="8 vCore" />
                      <FormSelectOption value="16" label="16 vCore" />
                    </FormSelect>
                  </FormGroup>
                  <FormGroup label="Memory" isRequired fieldId="cloud-vm-memory">
                    <FormSelect
                      id="cloud-vm-memory"
                      value={memory}
                      onChange={(_event, value) => setMemory(String(value))}
                    >
                      <FormSelectOption value="16" label="16 GiB" />
                      <FormSelectOption value="32" label="32 GiB" />
                      <FormSelectOption value="64" label="64 GiB" />
                    </FormSelect>
                  </FormGroup>
                  <FormGroup label="ROOT Disk" fieldId="cloud-vm-root-disk">
                    <TextInput id="cloud-vm-root-disk" value={rootDisk} isReadOnly />
                  </FormGroup>
                </Form>
                <Alert
                  isInline
                  title="컴퓨트 자원 구성 시 참고사항"
                  variant="info"
                  icon={<InfoCircleIcon />}
                  className="ct-cloud-vm-wizard__info"
                >
                  <Content component="p">
                    클라우드센터 VM의 Compute 자원은 클라우드센터가 관리해야 할 호스트의 수에 따라 탄력적으로 선택합니다.
                  </Content>
                  <Content component="p">
                    가상머신이 컨트롤 할 호스트의 수가 10개 미만이면 8 vCore를, 그 이상이면 16 vCore를 선택하십시오.
                    메모리는 컨트롤할 호스트의 수가 10개 미만이면 16GiB를, 10 ~ 20개 이면 32GiB를, 21개 이상이면 64GiB를 선택해야 합니다.
                  </Content>
                </Alert>
              </div>
            </WizardStep>,
            <WizardStep name="네트워크" id="cloud-vm-network" key="cloud-vm-network">
              <div className="ct-cloud-vm-wizard__content">
                <Content>
                  <Content component="p">
                    클라우드센터 VM이 사용할 관리 네트워크용 NIC 정보를 설정합니다.
                    아래의 항목에 적합한 값을 선택하여 입력하십시오.
                  </Content>
                </Content>
                <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
                  <FormGroup label="네트워크 구성" isRequired fieldId="cloud-vm-network-config">
                    <div className="ct-cloud-vm-wizard__inline">
                      <Label color="blue">관리 네트워크 (필수)</Label>
                      <Radio
                        id="cloud-vm-svc-enabled"
                        name="cloud-vm-svc-enabled"
                        label="서비스 네트워크 사용"
                        isChecked={svcEnabled}
                        onChange={() => setSvcEnabled(true)}
                      />
                      <Radio
                        id="cloud-vm-svc-disabled"
                        name="cloud-vm-svc-enabled"
                        label="서비스 네트워크 미사용"
                        isChecked={!svcEnabled}
                        onChange={() => setSvcEnabled(false)}
                      />
                    </div>
                  </FormGroup>
                  <FormGroup label="관리네트워크" isRequired fieldId="cloud-vm-mgmt-bridge">
                    <FormSelect
                      id="cloud-vm-mgmt-bridge"
                      value={mgmtBridge}
                      onChange={(_event, value) => setMgmtBridge(String(value))}
                    >
                      <FormSelectOption value="bridge0 (connected)" label="bridge0 (connected)" />
                      <FormSelectOption value="bridge1 (connected)" label="bridge1 (connected)" />
                      <FormSelectOption value="bridge2 (disconnected)" label="bridge2 (disconnected)" />
                    </FormSelect>
                  </FormGroup>
                  <FormGroup label="서비스네트워크" isRequired fieldId="cloud-vm-svc-bridge">
                    <FormSelect
                      id="cloud-vm-svc-bridge"
                      value={svcBridge}
                      onChange={(_event, value) => setSvcBridge(String(value))}
                      isDisabled={!svcEnabled}
                    >
                      <FormSelectOption value="bridge1 (connected)" label="bridge1 (connected)" />
                      <FormSelectOption value="bridge2 (disconnected)" label="bridge2 (disconnected)" />
                    </FormSelect>
                  </FormGroup>
                </Form>
                <Alert
                  isInline
                  title="네트워크 구성 시 참고사항"
                  variant="info"
                  icon={<InfoCircleIcon />}
                  className="ct-cloud-vm-wizard__info"
                >
                  <Content component="p">
                    클라우드센터에 접근하고자 하는 네트워크 위치에 따라 가상머신에 할당할 네트워크와 네트워크의 상위 브릿지를 선택합니다.
                    관리네트워크는 호스트를 관리하기 위해 필수적인 네트워크이며 기본 선택되어 있습니다.
                  </Content>
                  <Content component="p">
                    가상머신에 네트워크를 할당하기 전에 반드시 상위 브릿지를 먼저 생성해야 합니다.
                  </Content>
                </Alert>
              </div>
            </WizardStep>,
          ]}
        />

        <WizardStep name="추가 네트워크 정보" id="cloud-vm-additional">
          <div className="ct-cloud-vm-wizard__content">
            <Content>
              <Content component="p">
                클라우드센터 VM에 호스트명 등의 부가적인 네트워크 정보를 설정합니다. 아래의 항목에 값을 입력하십시오.
              </Content>
            </Content>
            <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
              <FormGroup label="클러스터 구성 파일 준비" isRequired fieldId="cloud-vm-hosts-file">
                <div className="ct-cloud-vm-wizard__inline">
                  <Radio
                    id="cloud-vm-hosts-file-existing"
                    name="cloud-vm-hosts-file"
                    label="해당 호스트 파일 사용"
                    isChecked={hostsFileMode === "existing"}
                    onChange={() => setHostsFileMode("existing")}
                  />
                  <Radio
                    id="cloud-vm-hosts-file-new"
                    name="cloud-vm-hosts-file"
                    label="신규 생성"
                    isChecked={hostsFileMode === "new"}
                    onChange={() => setHostsFileMode("new")}
                  />
                </div>
              </FormGroup>
              <FormGroup label="현재 호스트명" isRequired fieldId="cloud-vm-current-host">
                <TextInput id="cloud-vm-current-host" value={currentHostname} isReadOnly />
              </FormGroup>
              <FormGroup label="구성할 호스트 수" isRequired fieldId="cloud-vm-host-count">
                <div className="ct-cloud-vm-wizard__stepper">
                  <Button variant="control" onClick={() => updateHostCount(hostCount - 1)} aria-label="Minus">
                    -
                  </Button>
                  <div className="ct-cloud-vm-wizard__stepper-value">{hostCount}</div>
                  <Button variant="control" onClick={() => updateHostCount(hostCount + 1)} aria-label="Plus">
                    +
                  </Button>
                  <span className="ct-cloud-vm-wizard__stepper-unit">대</span>
                </div>
              </FormGroup>
            </Form>

            <div className="ct-cloud-vm-wizard__table-wrap">
              <div className="ct-cloud-vm-wizard__table-title">클러스터 구성 프로파일</div>
              <table className="ct-cloud-vm-wizard__table">
                <thead>
                  <tr>
                    <th>IDX</th>
                    <th>호스트명</th>
                    <th>호스트 IP</th>
                    <th>CCVM MNGT IP</th>
                    <th>HOST PN IP</th>
                    <th>HOST CN IP</th>
                  </tr>
                </thead>
                <tbody>
                  {hosts.map((row, idx) => (
                    <tr key={row.hostName || idx}>
                      <td>{idx + 1}</td>
                      <td>{row.hostName}</td>
                      <td>{row.hostIp}</td>
                      <td>{row.ccvmMgmtIp}</td>
                      <td>{row.hostPnIp}</td>
                      <td>{row.hostCnIp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
              <FormGroup label="호스트명(CCVM)" isRequired fieldId="cloud-vm-hostname">
                <TextInput
                  id="cloud-vm-hostname"
                  value={ccvmHostname}
                  onChange={(_event, value) => setCcvmHostname(String(value))}
                />
              </FormGroup>
              <FormGroup label="관리 NIC IP" isRequired fieldId="cloud-vm-mgmt-ip">
                <TextInput
                  id="cloud-vm-mgmt-ip"
                  value={mgmtIp}
                  onChange={(_event, value) => setMgmtIp(String(value))}
                />
              </FormGroup>
              <FormGroup label="관리 NIC Gateway" fieldId="cloud-vm-mgmt-gw">
                <TextInput
                  id="cloud-vm-mgmt-gw"
                  value={mgmtGateway}
                  onChange={(_event, value) => setMgmtGateway(String(value))}
                />
              </FormGroup>
              <FormGroup label="관리 NIC DNS" fieldId="cloud-vm-mgmt-dns">
                <TextInput
                  id="cloud-vm-mgmt-dns"
                  value={mgmtDns}
                  onChange={(_event, value) => setMgmtDns(String(value))}
                />
              </FormGroup>
              <FormGroup label="관리 VLAN ID" fieldId="cloud-vm-mgmt-vlan">
                <TextInput
                  id="cloud-vm-mgmt-vlan"
                  value={mgmtVlan}
                  onChange={(_event, value) => setMgmtVlan(String(value))}
                />
              </FormGroup>
              <FormGroup label="서비스 NIC IP" fieldId="cloud-vm-svc-ip">
                <TextInput
                  id="cloud-vm-svc-ip"
                  value={svcIp}
                  onChange={(_event, value) => setSvcIp(String(value))}
                  isDisabled={!svcEnabled}
                />
              </FormGroup>
              <FormGroup label="서비스 NIC Gateway" fieldId="cloud-vm-svc-gw">
                <TextInput
                  id="cloud-vm-svc-gw"
                  value={svcGateway}
                  onChange={(_event, value) => setSvcGateway(String(value))}
                  isDisabled={!svcEnabled}
                />
              </FormGroup>
              <FormGroup label="서비스 NIC DNS" fieldId="cloud-vm-svc-dns">
                <TextInput
                  id="cloud-vm-svc-dns"
                  value={svcDns}
                  onChange={(_event, value) => setSvcDns(String(value))}
                  isDisabled={!svcEnabled}
                />
              </FormGroup>
              <FormGroup label="서비스 VLAN ID" fieldId="cloud-vm-svc-vlan">
                <TextInput
                  id="cloud-vm-svc-vlan"
                  value={svcVlan}
                  onChange={(_event, value) => setSvcVlan(String(value))}
                  isDisabled={!svcEnabled}
                />
              </FormGroup>
            </Form>
          </div>
        </WizardStep>

        <WizardStep name="SSH Key 정보" id="cloud-vm-ssh">
          <div className="ct-cloud-vm-wizard__content">
            <Content>
              <Content component="p">
                클라우드센터 VM과 호스트, 그리고 ABLESTACK을 구성하고 있는 가상머신들과의 SSH 연결을 위해 SSH Key를 설정합니다.
              </Content>
            </Content>
            <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
              <FormGroup label="SSH 개인 Key 파일" isRequired fieldId="cloud-vm-ssh-private">
                <TextArea
                  id="cloud-vm-ssh-private"
                  value={sshPrivateKey}
                  onChange={(_event, value) => setSshPrivateKey(String(value))}
                  rows={3}
                />
              </FormGroup>
              <FormGroup label="SSH 공개 Key 파일" isRequired fieldId="cloud-vm-ssh-public">
                <TextArea
                  id="cloud-vm-ssh-public"
                  value={sshPublicKey}
                  onChange={(_event, value) => setSshPublicKey(String(value))}
                  rows={3}
                />
              </FormGroup>
            </Form>
            <Alert
              isInline
              title="SSH Key 등록 참고사항"
              variant="info"
              icon={<InfoCircleIcon />}
              className="ct-cloud-vm-wizard__info"
            >
              <Content component="p">
                SSH Key는 호스트 및 클라우드센터, 스토리지센터 가상머신 등의 ABLESTACK 구성요소 간의 암호화된 인증을 위해 사용됩니다.
              </Content>
              <Content component="p">
                호스트 간, 가상머신 간의 모든 명령은 SSH를 이용해 전달되며 이 때 SSH Key를 이용해 인증을 처리합니다.
                따라서 모든 호스트, 가상머신은 동일한 SSH Key를 사용해야 합니다.
              </Content>
            </Alert>
          </div>
        </WizardStep>

        <WizardStep name="장애조치 클러스터 설정" id="cloud-vm-failover">
          <div className="ct-cloud-vm-wizard__content">
            <Content>
              <Content component="p">
                장애조치 클러스터는 클라우드센터 VM이 실행 중인 호스트에 장애가 발생하는 경우 클라우드센터 VM을 안전하게 다른 호스트에서 실행하도록 하기 위해 구성합니다.
              </Content>
            </Content>
            <Form className="ct-cloud-vm-wizard__section ct-cloud-vm-wizard__form-horizontal" isHorizontal>
              <FormGroup label="클러스터 멤버수" isRequired fieldId="cloud-vm-failover-members">
                <TextInput
                  id="cloud-vm-failover-members"
                  value={String(failoverMembers)}
                  onChange={(_event, value) => setFailoverMembers(Number(value))}
                  type="number"
                />
              </FormGroup>
              <FormGroup label="클러스터 호스트 1" fieldId="cloud-vm-failover-host1">
                <TextInput
                  id="cloud-vm-failover-host1"
                  value={failoverHost1}
                  onChange={(_event, value) => setFailoverHost1(String(value))}
                />
              </FormGroup>
              <FormGroup label="클러스터 호스트 2" fieldId="cloud-vm-failover-host2">
                <TextInput
                  id="cloud-vm-failover-host2"
                  value={failoverHost2}
                  onChange={(_event, value) => setFailoverHost2(String(value))}
                />
              </FormGroup>
              <FormGroup label="클러스터 호스트 3" fieldId="cloud-vm-failover-host3">
                <TextInput
                  id="cloud-vm-failover-host3"
                  value={failoverHost3}
                  onChange={(_event, value) => setFailoverHost3(String(value))}
                />
              </FormGroup>
            </Form>
          </div>
        </WizardStep>

        <WizardStep name="설정확인" id="cloud-vm-review">
          <div className="ct-cloud-vm-wizard__content">
            <Content>
              <Content component="p">
                클라우드센터 VM의 배포를 위해 입력한 설정 정보는 다음과 같습니다.
                입력한 정보를 수정하고자 하는 경우, 해당 탭으로 이동하여 정보를 수정하십시오.
              </Content>
              <Content component="p">모든 정보를 확인한 후 "배포"를 시작합니다.</Content>
            </Content>

            <div className="ct-cloud-vm-wizard__review-accordion">
              <div className="ct-cloud-vm-wizard__review-section">
                <button
                  type="button"
                  className="ct-cloud-vm-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, appliance: !prev.appliance }))}
                >
                  클라우드센터 VM 설정
                  <span className={reviewOpen.appliance ? "ct-cloud-chevron ct-cloud-chevron--open" : "ct-cloud-chevron"}>
                    ▾
                  </span>
                </button>
                {reviewOpen.appliance && (
                  <div className="ct-cloud-vm-wizard__review-body">
                    <DescriptionList isHorizontal className="ct-cloud-vm-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 민감도</DescriptionListTerm>
                        <DescriptionListDescription>{clusterSensitivity} 초</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>CPU Core</DescriptionListTerm>
                        <DescriptionListDescription>{cpu} vCore</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Memory</DescriptionListTerm>
                        <DescriptionListDescription>{memory} GiB</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>ROOT Disk</DescriptionListTerm>
                        <DescriptionListDescription>{rootDisk}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>네트워크 구성</DescriptionListTerm>
                        <DescriptionListDescription>{networkConfigLabel}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>관리용 Bridge</DescriptionListTerm>
                        <DescriptionListDescription>{mgmtBridge}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>서비스용 Bridge</DescriptionListTerm>
                        <DescriptionListDescription>{svcEnabled ? svcBridge : "N/A"}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-cloud-vm-wizard__review-section">
                <button
                  type="button"
                  className="ct-cloud-vm-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, additional: !prev.additional }))}
                >
                  추가 네트워크 정보
                  <span className={reviewOpen.additional ? "ct-cloud-chevron ct-cloud-chevron--open" : "ct-cloud-chevron"}>
                    ▾
                  </span>
                </button>
                {reviewOpen.additional && (
                  <div className="ct-cloud-vm-wizard__review-body">
                    <DescriptionList isHorizontal className="ct-cloud-vm-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 구성 준비</DescriptionListTerm>
                        <DescriptionListDescription>
                          {hostsFileMode === "existing" ? "해당 호스트 파일 사용" : "신규 생성"}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>호스트명(CCVM)</DescriptionListTerm>
                        <DescriptionListDescription>{ccvmHostname}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>관리 NIC 정보</DescriptionListTerm>
                        <DescriptionListDescription>
                          IP Addr : {mgmtIp}
                          <br />
                          Gateway : {mgmtGateway}
                          <br />
                          DNS : {mgmtDns}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>서비스 NIC 정보</DescriptionListTerm>
                        <DescriptionListDescription>
                          IP Addr : {svcEnabled ? svcIp || "-" : "N/A"}
                          <br />
                          Gateway : {svcEnabled ? svcGateway || "-" : "N/A"}
                          <br />
                          DNS : {svcEnabled ? svcDns || "-" : "N/A"}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                    <div className="ct-cloud-vm-wizard__review-textarea">
                      <TextArea isReadOnly value={buildHostsPreview()} rows={6} />
                    </div>
                  </div>
                )}
              </div>

              <div className="ct-cloud-vm-wizard__review-section">
                <button
                  type="button"
                  className="ct-cloud-vm-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, ssh: !prev.ssh }))}
                >
                  SSH Key 정보
                  <span className={reviewOpen.ssh ? "ct-cloud-chevron ct-cloud-chevron--open" : "ct-cloud-chevron"}>
                    ▾
                  </span>
                </button>
                {reviewOpen.ssh && (
                  <div className="ct-cloud-vm-wizard__review-body">
                    <DescriptionList isHorizontal className="ct-cloud-vm-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>SSH 개인 Key 파일</DescriptionListTerm>
                        <DescriptionListDescription>
                          {sshPrivateKey ? "등록됨" : "미입력"}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>SSH 공개 Key 파일</DescriptionListTerm>
                        <DescriptionListDescription>
                          {sshPublicKey ? "등록됨" : "미입력"}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-cloud-vm-wizard__review-section">
                <button
                  type="button"
                  className="ct-cloud-vm-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, cluster: !prev.cluster }))}
                >
                  장애조치 클러스터 설정
                  <span className={reviewOpen.cluster ? "ct-cloud-chevron ct-cloud-chevron--open" : "ct-cloud-chevron"}>
                    ▾
                  </span>
                </button>
                {reviewOpen.cluster && (
                  <div className="ct-cloud-vm-wizard__review-body">
                    <DescriptionList isHorizontal className="ct-cloud-vm-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 멤버수</DescriptionListTerm>
                        <DescriptionListDescription>{failoverMembers} 대</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 호스트</DescriptionListTerm>
                        <DescriptionListDescription>
                          {failoverHost1}
                          {failoverHost2 ? `, ${failoverHost2}` : ""}
                          {failoverHost3 ? `, ${failoverHost3}` : ""}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>
            </div>
          </div>
        </WizardStep>

        <WizardStep name="배포" id="cloud-vm-deploy">
          <div className="ct-cloud-vm-wizard__content">
            <Content component="p" className="ct-cloud-vm-wizard__deploy-title">
              클라우드센터 가상머신을 배포 중입니다. 전체 5단계 중 4단계 진행 중입니다.
            </Content>
            <div className="ct-cloud-vm-wizard__status-list">
              <div>
                <Label color="green">완료됨</Label>
                <span>클러스터 구성 HOST 네트워크 연결 테스트</span>
              </div>
              <div>
                <Label color="green">완료됨</Label>
                <span>클러스터 구성 설정 초기화 작업</span>
              </div>
              <div>
                <Label color="green">완료됨</Label>
                <span>cloudinit iso 파일 생성</span>
              </div>
              <div>
                <div className="ct-cloud-vm-wizard__status-running">
                  <Spinner size="md" aria-label="진행중" />
                  <span className="ct-cloud-vm-wizard__status-running-text">진행중</span>
                </div>
                <span>클라우드센터 가상머신 구성</span>
              </div>
              <div>
                <Label color="blue">준비중</Label>
                <span>클러스터 구성 및 클라우드센터 가상머신 배포</span>
              </div>
            </div>
          </div>
        </WizardStep>

        <WizardStep name="완료" id="cloud-vm-finish">
          <div className="ct-cloud-vm-wizard__content">
            <Content>
              <Content component="p">
                클라우드센터 VM의 배포를 완료했습니다. 가상머신이 배포되면 다음의 작업을 수행해야 합니다.
              </Content>
              <Content component="ul">
                <Content component="li">클라우드센터 VM의 웹관리콘솔에 접속</Content>
                <Content component="li">ABLESTACK에 대한 클라우드 Zone 구성</Content>
                <Content component="li">가상머신 생성을 위한 각종 정책 준비</Content>
              </Content>
              <Content component="p">위의 모든 작업은 클라우드센터 VM의 웹 관리콘솔을 이용해 진행합니다.</Content>
            </Content>
          </div>
        </WizardStep>
      </Wizard>
    </Modal>
  );
}
