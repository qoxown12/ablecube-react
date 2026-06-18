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
import GfsResourceStatus from "../cards/gfs-resource-status";
import GfsDiskStatus from "../cards/gfs-disk-status";
import GfsIntegrationStatus from "../cards/gfs-integration-status";
import LocalDiskStatus from "../cards/local-disk-status";
import ClusterConfigPrepareWizardModal from "../wizard/cluster-config-prepare-wizard";
import StorageVmDeployWizardModal from "../wizard/storage-vm-deploy-wizard";
import CloudVmDeployWizardModal from "../wizard/cloud-vm-deploy-wizard";
import MonitoringCenterWizardModal from "../wizard/monitoring-center-wizard";
import GfsStorageConfigureWizardModal from "../wizard/gfs-storage-configure-wizard";
import LocalStorageConfigureWizardModal from "../wizard/local-storage-configure-wizard";
import ActionProgressModal from "../components/common/ActionProgressModal";
import type { ActionProgressPhase } from "../components/common/ActionProgressModal";
import {
  fetchCloudCenterUrl,
  fetchMonitoringCenterUrl,
  fetchStorageCenterUrl,
} from "../services/api/url";
import ConfigFileDownloadModal from "./config-file-download-modal";
import LicenseManagementModal from "./license-management-modal";
import RibbonActionNoticeModal from "./ribbon-action-notice-modal";

import "./status.scss";

interface RibbonNotice {
  title: string;
  message: string;
}

export default function StatusPage() {
  const [isClusterWizardOpen, setIsClusterWizardOpen] = React.useState(false);
  const [isStorageVmWizardOpen, setIsStorageVmWizardOpen] = React.useState(false);
  const [isCloudVmWizardOpen, setIsCloudVmWizardOpen] = React.useState(false);
  const [isMonitoringWizardOpen, setIsMonitoringWizardOpen] = React.useState(false);
  const [isGfsWizardOpen, setIsGfsWizardOpen] = React.useState(false);
  const [isLocalStorageWizardOpen, setIsLocalStorageWizardOpen] = React.useState(false);
  const [isConfigFileDownloadOpen, setIsConfigFileDownloadOpen] = React.useState(false);
  const [isLicenseManagementOpen, setIsLicenseManagementOpen] = React.useState(false);
  const [ribbonNotice, setRibbonNotice] = React.useState<RibbonNotice | null>(null);
  const [linkProgress, setLinkProgress] = React.useState<{
    isOpen: boolean;
    title: string;
    phase: ActionProgressPhase;
    message: string;
  }>({
    isOpen: false,
    title: "",
    phase: "running",
    message: "",
  });

  const closeRibbonNotice = () => {
    setRibbonNotice(null);
  };

  const showPendingAction = (title: string) => {
    setRibbonNotice({
      title,
      message: `${title} 화면은 구버전 ABLESTACK UI에서 확인된 항목이며 React 화면 이관 대기 중입니다.`,
    });
  };

  const openCenterUrl = async (
    title: string,
    fetcher: () => Promise<string>
  ) => {
    const targetWindow = window.open("about:blank", "_blank");

    if (!targetWindow) {
      setLinkProgress({
        isOpen: true,
        title,
        phase: "error",
        message: "브라우저 팝업 차단을 해제한 후 다시 시도해주세요.",
      });
      return;
    }

    try {
      targetWindow.document.title = title;
      targetWindow.document.body.textContent = "연결 주소를 확인하는 중입니다.";

      const url = await fetcher();

      targetWindow.opener = null;
      targetWindow.location.href = url;
    } catch (error) {
      targetWindow.close();
      setLinkProgress({
        isOpen: true,
        title,
        phase: "error",
        message: error instanceof Error
          ? error.message
          : `${title} 주소 조회에 실패했습니다.`,
      });
    }
  };

  const closeLinkProgress = () => {
    setLinkProgress((prev) => ({ ...prev, isOpen: false }));
  };

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
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => setIsClusterWizardOpen(true)}
        >
          클러스터 구성 준비
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => setIsStorageVmWizardOpen(true)}
        >
          스토리지센터 가상머신 배포
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => setIsCloudVmWizardOpen(true)}
        >
          클라우드센터 VM 배포
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => openCenterUrl("스토리지센터 대시보드 연결", fetchStorageCenterUrl)}
        >
          스토리지센터 대시보드 연결
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => setIsGfsWizardOpen(true)}
        >
          GFS 스토리지 구성
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => showPendingAction("HCI 공유 파일 구성")}
        >
          HCI 공유 파일 구성
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => setIsLocalStorageWizardOpen(true)}
        >
          로컬 스토리지 구성
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => openCenterUrl("클라우드센터 연결", fetchCloudCenterUrl)}
        >
          클라우드센터 연결
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => setIsMonitoringWizardOpen(true)}
        >
          모니터링센터 구성
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => openCenterUrl("모니터링센터 대시보드 연결", fetchMonitoringCenterUrl)}
        >
          모니터링센터 대시보드 연결
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => setIsConfigFileDownloadOpen(true)}
        >
          설정파일 다운로드
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => setIsLicenseManagementOpen(true)}
        >
          라이센스 관리
        </Button>
        <Button
          variant={ButtonVariant.secondary}
          onClick={() => showPendingAction("보안 업데이트")}
        >
          보안 업데이트
        </Button>
        <Button variant={ButtonVariant.secondary} isDisabled>
          ABLESTACK Version 업데이트
        </Button>
      </PageSection>

      <ClusterConfigPrepareWizardModal
        isOpen={isClusterWizardOpen}
        onClose={() => setIsClusterWizardOpen(false)}
      />

      <StorageVmDeployWizardModal
        isOpen={isStorageVmWizardOpen}
        onClose={() => setIsStorageVmWizardOpen(false)}
      />

      <CloudVmDeployWizardModal
        isOpen={isCloudVmWizardOpen}
        onClose={() => setIsCloudVmWizardOpen(false)}
      />

      <MonitoringCenterWizardModal
        isOpen={isMonitoringWizardOpen}
        onClose={() => setIsMonitoringWizardOpen(false)}
      />

      <GfsStorageConfigureWizardModal
        isOpen={isGfsWizardOpen}
        onClose={() => setIsGfsWizardOpen(false)}
      />

      <LocalStorageConfigureWizardModal
        isOpen={isLocalStorageWizardOpen}
        onClose={() => setIsLocalStorageWizardOpen(false)}
      />

      <ConfigFileDownloadModal
        isOpen={isConfigFileDownloadOpen}
        onClose={() => setIsConfigFileDownloadOpen(false)}
      />

      <LicenseManagementModal
        isOpen={isLicenseManagementOpen}
        onClose={() => setIsLicenseManagementOpen(false)}
      />

      <RibbonActionNoticeModal
        isOpen={Boolean(ribbonNotice)}
        title={ribbonNotice?.title ?? ""}
        message={ribbonNotice?.message ?? ""}
        onClose={closeRibbonNotice}
      />

      <ActionProgressModal
        isOpen={linkProgress.isOpen}
        title={linkProgress.title}
        phase={linkProgress.phase}
        message={linkProgress.message}
        onClose={closeLinkProgress}
      />

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

      {/* 하단 카드 (SystemInfo, Configuration) */}
      <PageSection isFilled>
        <Gallery hasGutter className="ct-system-status">
          <GfsResourceStatus />
          <GfsDiskStatus />
        </Gallery>
      </PageSection>

      {/* 하단 카드 (GFS Integration, Local Disk) */}
      <PageSection isFilled>
        <Gallery hasGutter className="ct-system-status">
          <GfsIntegrationStatus />
          <LocalDiskStatus />
        </Gallery>
      </PageSection>
    </>
  );
}
