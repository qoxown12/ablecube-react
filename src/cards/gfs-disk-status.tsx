import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
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
import { EllipsisVIcon, StorageDomainIcon } from "@patternfly/react-icons";

import cockpit from "cockpit";
import "./status-card.scss";

const DEFAULT_DATA = {
  mode: "다중 모드",
  mountPath: "/mnt/glue-gfs",
  footerMessage: "GFS 디스크가 생성되었습니다.",
  footerColor: "#3e8635",
};

export default function GfsDiskStatus() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMaintenance, setIsMaintenance] = React.useState(false);

  const [data, setData] = React.useState({
    mode: "",
    mountPath: "",
    footerMessage: "",
    footerColor: "",
  });

  React.useEffect(() => {
    cockpit
      .spawn(["python3", "/root/ablecube-react/python/read_test_json.py"])
      .then((stdout) => {
        const parsed = JSON.parse(stdout);
        const next = parsed["gfs-disk-status"] ?? {};
        setData({ ...DEFAULT_DATA, ...next });
      })
      .catch((err) => {
        console.error("spawn error:", err);
        setData(DEFAULT_DATA);
      });
  }, []);

  const onSelect = () => setIsOpen(false);

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
                <StorageDomainIcon
                  style={{ fontSize: "var(--pf-global--icon--FontSize--lg)" }}
                  aria-hidden="true"
                />
                <span>GFS 디스크 상태</span>
              </Flex>
            </CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody>
        <DescriptionList isCompact className="ct-status-card__dl">
          <DescriptionListGroup>
            <DescriptionListTerm>모드</DescriptionListTerm>
            <DescriptionListDescription>{data.mode}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>마운트 경로</DescriptionListTerm>
            <DescriptionListDescription>
              <span className="ct-status-card__mount">{data.mountPath}</span>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>

      <CardFooter className="ct-status-card__footer" style={{ color: data.footerColor }}>
        {data.footerMessage}
      </CardFooter>
    </Card>
  );
}
