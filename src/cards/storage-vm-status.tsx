import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Label,
  Flex,
  FlexItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
} from "@patternfly/react-core";
import {
  VirtualMachineIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  EllipsisVIcon,
} from "@patternfly/react-icons";

import cockpit from "cockpit";
import "./storage-cluster-status.scss";

const VM_STATUS_META = {
  running: {
    label: "Running",
    color: "green",
    icon: <CheckCircleIcon />,
  },
  shutOff: {
    label: "Stopped",
    color: "orange",
    icon: <ExclamationTriangleIcon />,
  },
  HEALTH_ERR: {
    label: "Health Error",
    color: "red",
    icon: <ExclamationCircleIcon />,
  },
};

const FALLBACK_DATA = {
  vmStatus: "N/A",
  cpu: "N/A",
  memory: "N/A",
  rootDiskSize: "N/A",
  manageNicType: "N/A",
  manageNicIp: "N/A",
  manageNicPrefix: "N/A",
  manageNicGw: "N/A",
  manageNicDns: "N/A",
  storageServerNicType: "N/A",
  storageServerNicIp: "N/A",
  storageReplicationNicType: "N/A",
  storageReplicationNicIp: "N/A"
};

export default function StorageVmStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMaintenance, setIsMaintenance] = React.useState(false);

  const [data, setData] = React.useState({
    vmStatus: "",
    cpu: "",
    memory: "",
    rootDiskSize: "",
    manageNicType: "",
    manageNicIp: "",
    manageNicPrefix: "",
    manageNicGw: "",
    manageNicDns: "",
    storageServerNicType: "",
    storageServerNicIp: "",
    storageReplicationNicType: "",
    storageReplicationNicIp: ""
  });

  React.useEffect(() => {
    cockpit
      .spawn(["python3", `/root/ablecube-react/python/read_test_json.py`])
      .then((stdout) => {
        const parsed = JSON.parse(stdout);
        const data = parsed["storage-vm-status"];
        setData(data);
      })
      .catch((err) => {
        console.error("spawn error:", err);
        setData(FALLBACK_DATA);
      });
  }, []);

  const statusMeta = (VM_STATUS_META as any)[data.vmStatus] ?? {
    label: "상태 체크 중...",
    color: "orange",
    icon: <InfoCircleIcon />,
  };

  const isClusterError = data.vmStatus === "HEALTH_ERR";
  const footerMessage = isClusterError
    ? "스토리지센터 가상머신이 배포되었습니다."
    : "스토리지센터 가상머신이 배포되지 않았습니다.";
  const footerColor = isClusterError ? "#c9190b" : "#3e8635";

  const onSelect = () => setIsOpen(false);

  return (
    <Card className="ct-storage-cluster-status">
      <CardHeader
        className="ct-storage-cluster-status__header"
        actions={{
          actions: (
            <Dropdown
              isOpen={isOpen}
              onSelect={onSelect}
              onOpenChange={setIsOpen}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  variant="plain"
                  aria-label="카드 메뉴"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <EllipsisVIcon />
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem
                  isDisabled={isMaintenance}
                  onClick={() => {
                    setIsMaintenance(true);
                    setIsOpen(false);
                  }}
                >
                  유지보수 모드 설정
                </DropdownItem>

                <DropdownItem
                  isDisabled={!isMaintenance}
                  onClick={() => {
                    setIsMaintenance(false);
                    setIsOpen(false);
                  }}
                >
                  유지보수 모드 해제
                </DropdownItem>
              </DropdownList>
            </Dropdown>
          ),
        }}
      >
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <FlexItem>
            <CardTitle>
              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                <VirtualMachineIcon
                  style={{ fontSize: "var(--pf-global--icon--FontSize--lg)" }}
                  aria-hidden="true"
                />
                <span>스토리지센터 가상머신 상태</span>
              </Flex>
            </CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody>
        <DescriptionList isCompact className="ct-storage-cluster-status__dl">
          <DescriptionListGroup>
            <DescriptionListTerm>가상머신 상태</DescriptionListTerm>
            <DescriptionListDescription>
              <Label
                className="ct-health-label"
                color={statusMeta.color}
                icon={statusMeta.icon}
                variant="outline"
              >
                {statusMeta.label}
              </Label>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>CPU</DescriptionListTerm>
            <DescriptionListDescription>{data.cpu}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Memory</DescriptionListTerm>
            <DescriptionListDescription>{data.memory}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>ROOT Disk 크기</DescriptionListTerm>
            <DescriptionListDescription>{data.rootDiskSize}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm className="pf-v5-u-align-self-flex-start">관리 NIC</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex direction={{ default: "column" }}>
                <FlexItem>{data.manageNicType}</FlexItem>
                <FlexItem>{data.manageNicIp}</FlexItem>
                <FlexItem>{data.manageNicPrefix}</FlexItem>
                <FlexItem>{data.manageNicGw}</FlexItem>
                <FlexItem>{data.manageNicDns}</FlexItem>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm className="pf-v5-u-align-self-flex-start">스토리지 NIC</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex direction={{ default: "column" }}>
                <FlexItem>{data.storageServerNicType}</FlexItem>
                <FlexItem>{data.storageServerNicIp}</FlexItem>
                <FlexItem>{data.storageReplicationNicType}</FlexItem>
                <FlexItem>{data.storageReplicationNicIp}</FlexItem>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>

      <CardFooter className="ct-storage-cluster-status__footer" style={{ color: footerColor }}>
        {footerMessage}
      </CardFooter>
    </Card>
  );
}
