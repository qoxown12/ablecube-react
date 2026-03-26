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
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Alert,
} from "@patternfly/react-core";
import { InfoCircleIcon } from "@patternfly/react-icons";

import "./storage-vm-deploy-wizard.scss";

type DiskMode = "raid" | "lun";
type StorageTrafficMode = "passthrough" | "bridge";

interface ClusterHostRow {
  hostName: string;
  hostIp: string;
  scvmMgmtIp: string;
  hostPnIp: string;
  scvmPnIp: string;
  scvmCnIp: string;
}

interface StorageVmDeployWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_HOSTS: ClusterHostRow[] = [
  {
    hostName: "ablecube21",
    hostIp: "10.10.2.1",
    scvmMgmtIp: "10.10.2.11",
    hostPnIp: "100.100.2.1",
    scvmPnIp: "100.100.2.11",
    scvmCnIp: "100.200.2.11",
  },
  {
    hostName: "ablecube22",
    hostIp: "10.10.2.2",
    scvmMgmtIp: "10.10.2.12",
    hostPnIp: "100.100.2.2",
    scvmPnIp: "100.100.2.12",
    scvmCnIp: "100.200.2.12",
  },
  {
    hostName: "ablecube23",
    hostIp: "10.10.2.3",
    scvmMgmtIp: "10.10.2.13",
    hostPnIp: "100.100.2.3",
    scvmPnIp: "100.100.2.13",
    scvmCnIp: "100.200.2.13",
  },
];

export default function StorageVmDeployWizardModal({
  isOpen,
  onClose,
}: StorageVmDeployWizardModalProps) {
  const [cpu, setCpu] = React.useState("8");
  const [memory, setMemory] = React.useState("16");
  const [diskMode, setDiskMode] = React.useState<DiskMode>("raid");
  const [mgmtBridge, setMgmtBridge] = React.useState("br-mgmt0");
  const [storageTrafficMode, setStorageTrafficMode] = React.useState<StorageTrafficMode>("passthrough");
  const [storageBridge, setStorageBridge] = React.useState("br-storage0");
  const [replicaBridge, setReplicaBridge] = React.useState("br-replica0");
  const [hostCount, setHostCount] = React.useState(3);
  const [hosts, setHosts] = React.useState<ClusterHostRow[]>(DEFAULT_HOSTS);
  const [currentHostname] = React.useState("ablecube21");

  const [scvmHostname, setScvmHostname] = React.useState("scvm1");
  const [mgmtIp, setMgmtIp] = React.useState("10.10.2.11/16");
  const [mgmtGateway, setMgmtGateway] = React.useState("10.10.0.1");
  const [mgmtDns, setMgmtDns] = React.useState("8.8.8.8");
  const [storageIp, setStorageIp] = React.useState("100.100.2.11/24");
  const [replicaIp, setReplicaIp] = React.useState("100.200.2.11/24");
  const [ccvmMgmtIp, setCcvmMgmtIp] = React.useState("10.10.2.10");
  const [mgmtVlan, setMgmtVlan] = React.useState("");
  const [storageVlan, setStorageVlan] = React.useState("");
  const [replicaVlan, setReplicaVlan] = React.useState("");

  const [sshPrivateKey, setSshPrivateKey] = React.useState("");
  const [sshPublicKey, setSshPublicKey] = React.useState("");

  const [reviewOpen, setReviewOpen] = React.useState({
    device: true,
    additional: true,
    ssh: true,
  });
  const [disableNav, setDisableNav] = React.useState(false);

  const resetState = React.useCallback(() => {
    setCpu("8");
    setMemory("16");
    setDiskMode("raid");
    setMgmtBridge("br-mgmt0");
    setStorageTrafficMode("passthrough");
    setStorageBridge("br-storage0");
    setReplicaBridge("br-replica0");
    setHostCount(3);
    setHosts(DEFAULT_HOSTS);
    setScvmHostname("scvm1");
    setMgmtIp("10.10.2.11/16");
    setMgmtGateway("10.10.0.1");
    setMgmtDns("8.8.8.8");
    setStorageIp("100.100.2.11/24");
    setReplicaIp("100.200.2.11/24");
    setCcvmMgmtIp("10.10.2.10");
    setMgmtVlan("");
    setStorageVlan("");
    setReplicaVlan("");
    setSshPrivateKey("");
    setSshPublicKey("");
    setReviewOpen({ device: true, additional: true, ssh: true });
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
        scvmMgmtIp: "",
        hostPnIp: "",
        scvmPnIp: "",
        scvmCnIp: "",
      }));
      return [...prev, ...extras];
    });
  };

  const buildHostsPreview = () => {
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

  const wizardFooter = (
    activeStep: any,
    goToNextStep: () => void,
    goToPrevStep: () => void,
    close: () => void
  ) => {
    if (!activeStep) return null;
    const stepId = String(activeStep.id);
    const isFirst = stepId === "storage-vm-overview";
    const isReview = stepId === "storage-vm-review";
    const isFinish = stepId === "storage-vm-finish";
    const isDeploy = stepId === "storage-vm-deploy";
    return (
      <div className="ct-storage-vm-wizard__footer">
        {!isFinish && (
          <Button variant="primary" onClick={goToNextStep}>
            {isReview ? "배포" : isDeploy ? "다음" : "다음"}
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
      aria-label="스토리지센터 가상머신 배포 마법사"
      className="ct-storage-vm-wizard__modal"
    >
      <Wizard
        onClose={handleClose}
        onSave={handleClose}
        height="74vh"
        width="100%"
        navAriaLabel="스토리지센터 가상머신 배포 단계"
        className={disableNav ? "ct-storage-vm-wizard ct-storage-vm-wizard--nav-locked" : "ct-storage-vm-wizard"}
        footer={wizardFooter}
        navProps={{ "aria-disabled": disableNav }}
        onStepChange={(_event, currentStep) => {
          const stepId = String(currentStep.id);
          setDisableNav(stepId === "storage-vm-finish");
        }}
        header={
          <div className="ct-storage-vm-wizard__header">
            <div>
              <Title headingLevel="h1" size="2xl" className="ct-storage-vm-wizard__title">
                ABLESTACK 스토리지센터 가상머신 배포 마법사
              </Title>
              <Content className="ct-storage-vm-wizard__subtitle">
                <Content component="p">
                  현재 호스트에 ABLESTACK 스토리지센터 클러스터를 구성하기 위해 스토리지 가상머신 배포를 단계별로 실행합니다.
                </Content>
              </Content>
            </div>
            <button
              type="button"
              className="ct-storage-vm-wizard__close"
              aria-label="Close"
              onClick={handleClose}
            >
              ×
            </button>
          </div>
        }
      >
        <WizardStep name="개요" id="storage-vm-overview">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                스토리지 가상머신 배포 마법사는 현재 호스트에 스토리지를 구성하고 컨트롤할 수 있는 스토리지 가상머신의 속성을 설정하고 배포합니다.
                스토리지 가상머신을 배포하기 위해서는 다음의 정보가 필요합니다.
              </Content>
              <Content component="ul">
                <Content component="li">가상머신의 컴퓨트 정보</Content>
                <Content component="li">가상머신에 연결할 스토리지용 디스크 정보</Content>
                <Content component="li">네트워크 트래픽 처리를 위한 NIC 정보</Content>
                <Content component="li">SSH Key 및 호스트 NIC 설정 등의 추가 배포 정보</Content>
              </Content>
              <Content component="p">
                필요한 정보를 먼저 준비하십시오. 정보가 준비되었다면 "다음" 버튼을 눌러 가상머신 배포를 시작합니다.
              </Content>
            </Content>
          </div>
        </WizardStep>

        <WizardStep
          name="가상머신 장치 구성"
          id="storage-vm-device"
          steps={[
            <WizardStep name="컴퓨트" id="storage-vm-compute" key="storage-vm-compute">
              <div className="ct-storage-vm-wizard__content">
                <Content>
                  <Content component="p">
                    스토리지 가상머신을 구성하기 위해 CPU, Memory 등을 어떻게 구성할지 결정해야 합니다.
                    다음의 컴퓨트 자원 항목에 구성하고자 하는 자원의 값을 입력하십시오.
                  </Content>
                </Content>
                <Form className="ct-storage-vm-wizard__section ct-storage-vm-wizard__form-horizontal" isHorizontal>
                  <FormGroup label="CPU" isRequired fieldId="storage-vm-cpu">
                    <FormSelect
                      id="storage-vm-cpu"
                      value={cpu}
                      onChange={(_event, value) => setCpu(String(value))}
                    >
                      <FormSelectOption value="8" label="8 vCore" />
                      <FormSelectOption value="16" label="16 vCore" />
                    </FormSelect>
                  </FormGroup>
                  <FormGroup label="Memory" isRequired fieldId="storage-vm-memory">
                    <FormSelect
                      id="storage-vm-memory"
                      value={memory}
                      onChange={(_event, value) => setMemory(String(value))}
                    >
                      <FormSelectOption value="16" label="16 GiB" />
                      <FormSelectOption value="32" label="32 GiB" />
                      <FormSelectOption value="48" label="48 GiB" />
                      <FormSelectOption value="64" label="64 GiB" />
                    </FormSelect>
                  </FormGroup>
                  <FormGroup label="ROOT Disk" fieldId="storage-vm-root-disk">
                    <TextInput id="storage-vm-root-disk" value="70 GiB (THIN Provisioning)" isReadOnly />
                  </FormGroup>
                </Form>
                <Alert
                  isInline
                  title="컴퓨트 자원 구성 시 참고사항"
                  variant="info"
                  icon={<InfoCircleIcon />}
                  className="ct-storage-vm-wizard__info"
                >
                  <Content component="p">
                    스토리지의 성능 최적화를 위해 스토리지센터 가상머신의 컴퓨트 자원은 가상머신이 컨트롤 할
                    디스크의 수 및 가용량에 따라 적정하게 선택해야 합니다.
                  </Content>
                  <Content component="p">
                    가상머신이 컨트롤 할 호스트의 디스크가 10개 이내이면 8 vCore를, 그 이상이면 16 vCore를 선택하십시오.
                    메모리는 컨트롤할 호스트의 디스크 용량이 10TB 이내이면 16GiB를, 10 ~ 30 TB이면 32GiB를,
                    30TB를 초과하면 64GiB를 선택해야 합니다.
                  </Content>
                </Alert>
              </div>
            </WizardStep>,
            <WizardStep name="디스크" id="storage-vm-disk" key="storage-vm-disk">
              <div className="ct-storage-vm-wizard__content">
                <Content>
                  <Content component="p">
                    스토리지 가상머신이 스토리지용 디스크로 관리할 호스트의 디스크를 선택해야 합니다.
                    가상머신에 호스트의 디스크를 구성하는 방식을 먼저 선택한 후, 적합한 디스크를 선택하여 구성합니다.
                  </Content>
                </Content>
                <Form className="ct-storage-vm-wizard__section ct-storage-vm-wizard__form-horizontal" isHorizontal>
                  <FormGroup label="디스크 구성 방식" isRequired fieldId="storage-vm-disk-mode">
                    <div className="ct-storage-vm-wizard__inline">
                      <Radio
                        id="storage-vm-disk-raid"
                        name="storage-vm-disk-mode"
                        label="PCI Passthrough"
                        isChecked={diskMode === "raid"}
                        onChange={() => setDiskMode("raid")}
                      />
                      <Radio
                        id="storage-vm-disk-lun"
                        name="storage-vm-disk-mode"
                        label="LUN Passthrough"
                        isChecked={diskMode === "lun"}
                        onChange={() => setDiskMode("lun")}
                      />
                    </div>
                  </FormGroup>
                  <FormGroup label="디스크 구성 대상 장치" isRequired fieldId="storage-vm-disk-target">
                    <TextArea
                      id="storage-vm-disk-target"
                      value="선택 가능한 디스크 목록이 표시됩니다."
                      isReadOnly
                      rows={4}
                    />
                  </FormGroup>
                </Form>
                <Alert
                  isInline
                  title="디스크 자원 구성 시 참고사항"
                  variant="info"
                  icon={<InfoCircleIcon />}
                  className="ct-storage-vm-wizard__info"
                >
                  <Content component="p">
                    가장 좋은 성능을 제공하는 방식은 RAID Passthrough 입니다. 단, 호스트에 2개 이상의 RAID 장치가 있어서
                    호스트 OS RAID가 독립적으로 구성되어 있을 때 사용 가능합니다.
                  </Content>
                  <Content component="p">
                    RAID Passthrough를 사용할 수 없는 경우에는 디스크 전체를 가상머신에 할당하는 LUN Passthrough 방식을 선택하십시오.
                  </Content>
                </Alert>
              </div>
            </WizardStep>,
            <WizardStep name="네트워크" id="storage-vm-network" key="storage-vm-network">
              <div className="ct-storage-vm-wizard__content">
                <Content>
                  <Content component="p">
                    스토리지 가상머신을 클러스터링하고 관리할 뿐 아니라 데이터를 가상머신 간에 전송하고 복제할 수 있는
                    NIC를 가상머신에 구성해야 합니다. 가상머신의 NIC를 구성하기 위한 방식을 선택한 후 표시된 장치를 가상머신에 할당합니다.
                  </Content>
                </Content>
                <Form className="ct-storage-vm-wizard__section ct-storage-vm-wizard__form-horizontal" isHorizontal>
                  <FormGroup label="관리 NIC용 Bridge" isRequired fieldId="storage-vm-mgmt-bridge">
                    <FormSelect
                      id="storage-vm-mgmt-bridge"
                      value={mgmtBridge}
                      onChange={(_event, value) => setMgmtBridge(String(value))}
                    >
                      <FormSelectOption value="br-mgmt0" label="br-mgmt0" />
                      <FormSelectOption value="br-mgmt1" label="br-mgmt1" />
                    </FormSelect>
                  </FormGroup>
                  <FormGroup label="스토리지 트래픽 구성" isRequired fieldId="storage-vm-storage-mode">
                    <div className="ct-storage-vm-wizard__inline">
                      <Radio
                        id="storage-vm-storage-passthrough"
                        name="storage-vm-storage-mode"
                        label="NIC Passthrough"
                        isChecked={storageTrafficMode === "passthrough"}
                        onChange={() => setStorageTrafficMode("passthrough")}
                      />
                      <Radio
                        id="storage-vm-storage-bridge"
                        name="storage-vm-storage-mode"
                        label="Bridge"
                        isChecked={storageTrafficMode === "bridge"}
                        onChange={() => setStorageTrafficMode("bridge")}
                      />
                    </div>
                  </FormGroup>
                  <FormGroup label="서버용 NIC" isRequired fieldId="storage-vm-storage-bridge">
                    <FormSelect
                      id="storage-vm-storage-bridge"
                      value={storageBridge}
                      onChange={(_event, value) => setStorageBridge(String(value))}
                    >
                      <FormSelectOption value="br-storage0" label="br-storage0" />
                      <FormSelectOption value="br-storage1" label="br-storage1" />
                    </FormSelect>
                  </FormGroup>
                  <FormGroup label="복제용 NIC" isRequired fieldId="storage-vm-replica-bridge">
                    <FormSelect
                      id="storage-vm-replica-bridge"
                      value={replicaBridge}
                      onChange={(_event, value) => setReplicaBridge(String(value))}
                    >
                      <FormSelectOption value="br-replica0" label="br-replica0" />
                      <FormSelectOption value="br-replica1" label="br-replica1" />
                    </FormSelect>
                  </FormGroup>
                </Form>
              </div>
            </WizardStep>,
          ]}
        />

        <WizardStep name="추가 네트워크 정보" id="storage-vm-additional">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                스토리지 가상머신의 각종 네트워크 정보를 설정하기 위해 호스트명, IP 정보 등의 추가 네트워크 정보를 입력합니다.
                가상머신이 생성되면서 입력한 정보가 가상머신 내부에 자동으로 설정됩니다.
              </Content>
            </Content>

            <Form className="ct-storage-vm-wizard__section ct-storage-vm-wizard__form-horizontal" isHorizontal>
              <FormGroup label="현재 호스트명" isRequired fieldId="storage-vm-current-hostname">
                <TextInput id="storage-vm-current-hostname" value={currentHostname} isReadOnly />
              </FormGroup>
              <FormGroup label="구성할 호스트 수" isRequired fieldId="storage-vm-host-count">
                <div className="ct-storage-vm-wizard__stepper">
                  <Button variant="control" onClick={() => updateHostCount(hostCount - 1)}>
                    -
                  </Button>
                  <div className="ct-storage-vm-wizard__stepper-value">{hostCount}</div>
                  <Button variant="control" onClick={() => updateHostCount(hostCount + 1)}>
                    +
                  </Button>
                  <span className="ct-storage-vm-wizard__stepper-unit">대</span>
                </div>
              </FormGroup>

              <div className="ct-storage-vm-wizard__table-wrap">
                <div className="ct-storage-vm-wizard__table-title">클러스터 구성 프로파일</div>
                <table className="ct-storage-vm-wizard__table">
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

              <FormGroup label="호스트명(SCVM)" isRequired fieldId="storage-vm-hostname">
                <TextInput
                  id="storage-vm-hostname"
                  value={scvmHostname}
                  onChange={(_event, value) => setScvmHostname(value)}
                />
              </FormGroup>
              <FormGroup label="관리 NIC IP" isRequired fieldId="storage-vm-mgmt-ip">
                <div className="ct-storage-vm-wizard__inline-field">
                  <TextInput id="storage-vm-mgmt-ip" value={mgmtIp} onChange={(_event, value) => setMgmtIp(value)} />
                  <span>VLAN ID</span>
                  <TextInput id="storage-vm-mgmt-vlan" value={mgmtVlan} onChange={(_event, value) => setMgmtVlan(value)} />
                </div>
              </FormGroup>
              <FormGroup label="관리 NIC Gateway" fieldId="storage-vm-mgmt-gateway">
                <TextInput
                  id="storage-vm-mgmt-gateway"
                  value={mgmtGateway}
                  onChange={(_event, value) => setMgmtGateway(value)}
                />
              </FormGroup>
              <FormGroup label="관리 NIC DNS" fieldId="storage-vm-mgmt-dns">
                <TextInput
                  id="storage-vm-mgmt-dns"
                  value={mgmtDns}
                  onChange={(_event, value) => setMgmtDns(value)}
                />
              </FormGroup>
              <FormGroup label="스토리지 서버 NIC IP" isRequired fieldId="storage-vm-storage-ip">
                <div className="ct-storage-vm-wizard__inline-field">
                  <TextInput
                    id="storage-vm-storage-ip"
                    value={storageIp}
                    onChange={(_event, value) => setStorageIp(value)}
                  />
                  <span>VLAN ID</span>
                  <TextInput
                    id="storage-vm-storage-vlan"
                    value={storageVlan}
                    onChange={(_event, value) => setStorageVlan(value)}
                  />
                </div>
              </FormGroup>
              <FormGroup label="스토리지 복제 NIC IP" isRequired fieldId="storage-vm-replica-ip">
                <div className="ct-storage-vm-wizard__inline-field">
                  <TextInput
                    id="storage-vm-replica-ip"
                    value={replicaIp}
                    onChange={(_event, value) => setReplicaIp(value)}
                  />
                  <span>VLAN ID</span>
                  <TextInput
                    id="storage-vm-replica-vlan"
                    value={replicaVlan}
                    onChange={(_event, value) => setReplicaVlan(value)}
                  />
                </div>
              </FormGroup>
              <FormGroup label="CCVM 관리 IP" isRequired fieldId="storage-vm-ccvm-ip">
                <TextInput id="storage-vm-ccvm-ip" value={ccvmMgmtIp} onChange={(_event, value) => setCcvmMgmtIp(value)} />
              </FormGroup>
            </Form>
          </div>
        </WizardStep>

        <WizardStep name="SSH Key 정보" id="storage-vm-ssh">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                호스트 및 스토리지센터 가상머신 간의 암호화된 통신을 위해 생성되는 가상머신에 SSH Key를 설정해야 합니다.
                기본적으로 현재 호스트의 SSH Key 파일을 자동으로 등록하며, 필요시 다운로드 한 SSH Key 파일로 등록 가능합니다.
              </Content>
            </Content>
            <Form className="ct-storage-vm-wizard__section ct-storage-vm-wizard__form-horizontal" isHorizontal>
              <FormGroup label="SSH 개인 Key 파일" isRequired fieldId="storage-vm-ssh-private">
                <TextArea
                  id="storage-vm-ssh-private"
                  value={sshPrivateKey}
                  onChange={(_event, value) => setSshPrivateKey(value)}
                  rows={4}
                />
              </FormGroup>
              <FormGroup label="SSH 공개 Key 파일" isRequired fieldId="storage-vm-ssh-public">
                <TextArea
                  id="storage-vm-ssh-public"
                  value={sshPublicKey}
                  onChange={(_event, value) => setSshPublicKey(value)}
                  rows={3}
                />
              </FormGroup>
            </Form>
            <Alert
              isInline
              title="SSH Key 등록 참고사항"
              variant="info"
              icon={<InfoCircleIcon />}
              className="ct-storage-vm-wizard__info"
            >
              <Content component="p">
                SSH Key는 호스트 및 스토리지센터 가상머신 등의 ABLESTACK 구성요소 간의 암호화된 인증을 위해 사용됩니다.
              </Content>
              <Content component="p">
                호스트 간, 가상머신 간의 모든 명령은 SSH를 이용해 전달되며 이 때 SSH Key를 이용해 인증을 처리합니다.
                따라서 모든 호스트, 가상머신은 동일한 SSH Key를 사용해야 합니다.
              </Content>
            </Alert>
          </div>
        </WizardStep>

        <WizardStep name="설정확인" id="storage-vm-review">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                스토리지센터 VM의 배포를 위해 입력한 설정 정보는 다음과 같습니다. 입력한 정보를 수정하고자 하는 경우,
                해당 탭으로 이동하여 정보를 수정하십시오. 모든 정보를 확인한 후 "배포"를 시작합니다.
              </Content>
            </Content>
            <div className="ct-storage-vm-wizard__review-accordion">
              <div className="ct-storage-vm-wizard__review-section">
                <button
                  type="button"
                  className="ct-storage-vm-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, device: !prev.device }))}
                >
                  <span>가상머신 장치 구성</span>
                  <span className={reviewOpen.device ? "ct-storage-chevron ct-storage-chevron--open" : "ct-storage-chevron"}>▾</span>
                </button>
                {reviewOpen.device && (
                  <div className="ct-storage-vm-wizard__review-body">
                    <DescriptionList isCompact className="ct-storage-vm-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>CPU</DescriptionListTerm>
                        <DescriptionListDescription>{cpu} vCore</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Memory</DescriptionListTerm>
                        <DescriptionListDescription>{memory} GiB</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>ROOT Disk</DescriptionListTerm>
                        <DescriptionListDescription>70 GiB (THIN Provisioning)</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>네트워크</DescriptionListTerm>
                        <DescriptionListDescription>
                          관리 NIC: {mgmtBridge}
                        </DescriptionListDescription>
                        <DescriptionListDescription>
                          스토리지 NIC: {storageBridge} / 복제 NIC: {replicaBridge}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-storage-vm-wizard__review-section">
                <button
                  type="button"
                  className="ct-storage-vm-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, additional: !prev.additional }))}
                >
                  <span>추가 네트워크 정보</span>
                  <span className={reviewOpen.additional ? "ct-storage-chevron ct-storage-chevron--open" : "ct-storage-chevron"}>▾</span>
                </button>
                {reviewOpen.additional && (
                  <div className="ct-storage-vm-wizard__review-body">
                    <DescriptionList isCompact className="ct-storage-vm-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>클러스터 구성 프로파일</DescriptionListTerm>
                        <DescriptionListDescription>
                          <TextArea
                            readOnly
                            value={buildHostsPreview()}
                            rows={6}
                            className="ct-storage-vm-wizard__review-textarea"
                          />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>호스트명(SCVM)</DescriptionListTerm>
                        <DescriptionListDescription>{scvmHostname}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>관리 네트워크</DescriptionListTerm>
                        <DescriptionListDescription>{mgmtIp}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>스토리지 네트워크</DescriptionListTerm>
                        <DescriptionListDescription>{storageIp}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>CCVM 관리 IP</DescriptionListTerm>
                        <DescriptionListDescription>{ccvmMgmtIp}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-storage-vm-wizard__review-section">
                <button
                  type="button"
                  className="ct-storage-vm-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, ssh: !prev.ssh }))}
                >
                  <span>SSH Key 정보</span>
                  <span className={reviewOpen.ssh ? "ct-storage-chevron ct-storage-chevron--open" : "ct-storage-chevron"}>▾</span>
                </button>
                {reviewOpen.ssh && (
                  <div className="ct-storage-vm-wizard__review-body">
                    <DescriptionList isCompact className="ct-storage-vm-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>SSH 개인 Key</DescriptionListTerm>
                        <DescriptionListDescription>{sshPrivateKey || "-"}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>SSH 공개 Key</DescriptionListTerm>
                        <DescriptionListDescription>{sshPublicKey || "-"}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>
            </div>
          </div>
        </WizardStep>

        <WizardStep name="배포" id="storage-vm-deploy">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                스토리지센터 가상머신을 배포 중입니다. 전체 4단계 중 4단계 진행 중입니다.
              </Content>
            </Content>
            <div className="ct-storage-vm-wizard__status-list">
              <div>
                <Label color="green" variant="outline">완료</Label>
                <span>스토리지센터 가상머신 초기화 작업</span>
              </div>
              <div>
                <Label color="green" variant="outline">완료</Label>
                <span>cloudinit iso 파일 생성</span>
              </div>
              <div>
                <Label color="green" variant="outline">완료</Label>
                <span>스토리지센터 가상머신 구성</span>
              </div>
              <div>
                <Label color="orange" variant="outline">진행중</Label>
                <span>스토리지센터 가상머신 배포</span>
              </div>
            </div>
          </div>
        </WizardStep>

        <WizardStep name="완료" id="storage-vm-finish">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                스토리지 가상머신을 배포 완료하였습니다. 다음의 내용을 참고하여 배포된 스토리지 가상머신을 이용해
                스토리지 클러스터를 구성해야 합니다.
              </Content>
              <Content component="ul">
                <Content component="li">모든 호스트에 스토리지센터 가상머신을 배포 완료 했는지 확인합니다.</Content>
                <Content component="li">스토리지센터 접속 방법: https://ip:9090</Content>
                <Content component="li">스토리지센터에 접속하여 스토리지 클러스터를 구성하십시오.</Content>
              </Content>
              <Content component="p">
                추가 호스트 SCVM인 경우 Glue 대시보드에 접속하여 SCVM 추가 작업을 진행 해주세요.
              </Content>
              <Content component="p">마법사를 종료하려면 화면 상단의 닫기 버튼을 클릭하십시오.</Content>
            </Content>
          </div>
        </WizardStep>
      </Wizard>
    </Modal>
  );
}
