import React from "react";
import { Page } from "@patternfly/react-core";
import StatusPage from "./status/status";

// 전체 콘텐츠를 채우도록 설정
export default function App() {
  return (
    <Page className="pf-m-no-sidebar">
      <StatusPage />
    </Page>
  );
}
