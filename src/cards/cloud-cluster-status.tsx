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
  NetworkIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  EllipsisVIcon,
} from "@patternfly/react-icons";

import cockpit from "cockpit";
import "./storage-cluster-status.scss";

const CLUSTER_STATUS_META = {
  HEALTH_OK: {
    label: "Health Ok",
    color: "green",
    icon: <CheckCircleIcon />,
  },
  HEALTH_WARN: {
    label: "Health Warn",
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
  clusterStatus: "HEALTH_ERR",
  nodeStatus: "N/A",
  resourceStatus: "N/A",
  executionNode: "N/A",
};

export default function CloudClusterStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMaintenance, setIsMaintenance] = React.useState(false);

  const [data, setData] = React.useState({
    clusterStatus: "",
    nodeStatus: "",
    resourceStatus: "",
    executionNode: ""
  });

  React.useEffect(() => {
    cockpit
      .spawn(["python3", `/root/ablecube-react/python/read_test_json.py`])
      .then((stdout) => {
        const parsed = JSON.parse(stdout);
        const data = parsed["cloud-cluster-status"];
        setData(data);
      })
      .catch((err) => {
        console.error("spawn error:", err);
        setData(FALLBACK_DATA);
      });
  }, []);

  const statusMeta = (CLUSTER_STATUS_META as any)[data.clusterStatus] ?? {
    label: "상태 체크 중...",
    color: "orange",
    icon: <InfoCircleIcon />,
  };

  const isClusterError = data.clusterStatus === "HEALTH_ERR";
  const footerMessage = isClusterError
    ? "클라우드센터 클러스터가 구성되지 않았습니다."
    : "클라우드센터 클러스터가 구성되었습니다.";
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
                <NetworkIcon
                  style={{ fontSize: "var(--pf-global--icon--FontSize--lg)" }}
                  aria-hidden="true"
                />
                <span>클라우드센터 클러스터 상태</span>
              </Flex>
            </CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody>
        <DescriptionList isCompact className="ct-storage-cluster-status__dl">
          <DescriptionListGroup>
            <DescriptionListTerm>클러스터 상태</DescriptionListTerm>
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
            <DescriptionListTerm>노드구성</DescriptionListTerm>
            <DescriptionListDescription>{data.nodeStatus}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>리소스 상태</DescriptionListTerm>
            <DescriptionListDescription>{data.resourceStatus}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>VM실행노드</DescriptionListTerm>
            <DescriptionListDescription>{data.executionNode}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>

      <CardFooter className="ct-storage-cluster-status__footer" style={{ color: footerColor }}>
        {footerMessage}
      </CardFooter>
    </Card>
  );
}