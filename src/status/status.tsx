import React from "react";
import {
  PageSection,
  PageSectionVariants,
  Button,
  ButtonVariant,
} from "@patternfly/react-core";
import { Gallery } from "@patternfly/react-core/dist/esm/layouts/Gallery";

import StorageClusterStatus from "../cards/storage-cluster-status";
import CloudClusterStatus from "../cards/cloud-cluster-status";
import StorageVmStatus from "../cards/storage-vm-status";
import CloudVmStatus from "../cards/cloud-vm-status";

import "./status.scss";

export default function StatusPage() {
  return (
    <>
      {/* 헤더 */}
      <PageSection
        variant={PageSectionVariants.light}
        className="ct-status-header"
      >
        <div className="ct-status-header-hostname">
          <h1>ABLESTACK 가상어플라이언스 상태</h1>
          <div className="ct-status-header-desc">
            ABLESTACK 스토리지센터 및 클라우드센터 VM 배포되었으며 모니터링센터 구성이 완료되었습니다. 가상어플라이언스 상태가 정상입니다.
          </div>
        </div>
      </PageSection>

      {/* 버튼 */}
      <PageSection
        variant={PageSectionVariants.default}
        className="ct-status-buttons"
      >
        <Button variant={ButtonVariant.primary}>
          모니터링센터 대시보드 연결
        </Button>
        <Button variant={ButtonVariant.secondary}>
          설정파일 다운로드
        </Button>
        <Button variant={ButtonVariant.secondary}>
          라이센스 관리
        </Button>
      </PageSection>

      {/* 상단 카드 (Health, Usage) */}
      <PageSection className="ct-status-cards-top">
        <Gallery hasGutter 
          minWidths={{
            default: "520px", // 데스크탑: 2열 안정 + 카드 크게
            md: "420px",      // 중간 화면: 2열 유지
            sm: "320px",      // 작은 화면: 1열로 자연스럽게
          }}
          className="ct-system-status">
          <StorageClusterStatus />
          <CloudClusterStatus />  
        </Gallery>
      </PageSection>

      {/* 하단 카드 (SystemInfo, Configuration) */}
      <PageSection isFilled className="ct-status-cards-bottom">
        <Gallery hasGutter className="ct-system-status">
          <StorageVmStatus />
          <CloudVmStatus />
        </Gallery>
      </PageSection>
    </>
  );
}
