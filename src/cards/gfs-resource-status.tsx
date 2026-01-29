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
  CubesIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  EllipsisVIcon,
} from "@patternfly/react-icons";

import cockpit from "cockpit";
import "./status-card.scss";

const STATUS_META = {
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

const DEFAULT_DATA = {
  fenceDeviceStatus: "HEALTH_WARN",
  fenceDeviceDetail: "Stopped (10.10.13.1, 10.10.13.2, 10.10.13.3)",
  lockDeviceStatus: "HEALTH_OK",
  lockDeviceDetails: [
    "glue-dlm : Started (10.10.13.1, 10.10.13.2, 10.10.13.3)",
    "glue-lvmlockd : Started (10.10.13.1, 10.10.13.2, 10.10.13.3)",
  ],
};

export default function GfsResourceStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMaintenance, setIsMaintenance] = React.useState(false);

  const [data, setData] = React.useState({
    fenceDeviceStatus: "",
    fenceDeviceDetail: "",
    lockDeviceStatus: "",
    lockDeviceDetails: [] as string[],
  });

  React.useEffect(() => {
    cockpit
      .spawn(["python3", "/root/ablecube-react/python/read_test_json.py"])
      .then((stdout) => {
        const parsed = JSON.parse(stdout);
        const next = parsed["gfs-resource-status"] ?? {};
        setData({ ...DEFAULT_DATA, ...next });
      })
      .catch((err) => {
        console.error("spawn error:", err);
        setData(DEFAULT_DATA);
      });
  }, []);

  const onSelect = () => setIsOpen(false);

  const renderStatusDetail = (statusKey: string, detail?: string, detailLines?: string[]) => {
    const status =
      (STATUS_META as any)[statusKey] ?? {
        label: "상태 체크 중...",
        color: "orange",
        icon: <InfoCircleIcon />,
      };

    return (
      <Flex className="ct-status-card__detail" gap={{ default: "gapSm" }}>
        <Label
          className="ct-health-label"
          color={status.color}
          icon={status.icon}
          variant="outline"
        >
          {status.label}
        </Label>
        {detailLines && detailLines.length > 0 ? (
          <Flex direction={{ default: "column" }} className="ct-status-card__detail-text">
            {detailLines.map((line, index) => (
              <FlexItem key={`${line}-${index}`}>{line}</FlexItem>
            ))}
          </Flex>
        ) : (
          <span className="ct-status-card__detail-text">{detail}</span>
        )}
      </Flex>
    );
  };

  return (
    <Card className="ct-status-card">
      <CardHeader
        className="ct-status-card__header"
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
                <CubesIcon
                  style={{ fontSize: "var(--pf-global--icon--FontSize--lg)" }}
                  aria-hidden="true"
                />
                <span>GFS 리소스 상태</span>
              </Flex>
            </CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody>
        <DescriptionList isCompact className="ct-status-card__dl">
          <DescriptionListGroup>
            <DescriptionListTerm>펜스 장치 상태</DescriptionListTerm>
            <DescriptionListDescription>
              {renderStatusDetail(data.fenceDeviceStatus, data.fenceDeviceDetail)}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>잠금 장치 상태</DescriptionListTerm>
            <DescriptionListDescription>
              {renderStatusDetail(data.lockDeviceStatus, undefined, data.lockDeviceDetails)}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>

      <CardFooter className="ct-status-card__footer" style={{ color: "#3e8635" }}>
        GFS 리소스가 구성되었습니다.
      </CardFooter>
    </Card>
  );
}
