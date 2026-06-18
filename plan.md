# ablecube-react 개발 계획

## 목적

`ablecube-react`를 ABLESTACK UI의 차세대 버전으로 정리한다.  
기존 `ablestack-cockpit-plugin`의 HTML + PatternFly6 + jQuery 기반 화면과 기능을 기준으로, React와 PatternFly 6 기반 구조로 재구성하는 것이 목적이다.

## 기본 조건

1. UI는 `React 18`과 `PatternFly 6` 기준으로 구성한다.
2. `ablestack-cockpit-plugin`는 구버전 기준 프로젝트로 보고, 해당 기능과 화면 흐름을 기준으로 `ablecube-react`를 재구성한다.
3. 중복되는 로직, API 호출, 포맷 변환, 상태 처리, 공통 UI는 반드시 공통 함수/공통 컴포넌트로 분리한다.
4. 구버전의 Python3 백엔드 기능은 React 화면에서 직접 스크립트처럼 호출하지 않고, API 호출 방식으로 전환하는 것을 전제로 한다.

## 디자인 기준

`ablecube-react`의 UI 디자인은 새로 임의 디자인을 만들지 않고, 기존 `ablestack-cockpit-plugin`의 화면 톤을 최대한 따른다.

- 상단 상태 영역은 구버전의 `pf-c-alert` 리본 구조를 기준으로 제목, 설명, 액션 버튼을 한 영역에 배치한다.
- 상태 카드는 구버전의 `pf-c-card pf-m-hoverable pf-m-compact` 형태를 기준으로 테두리, 헤더 구분선, 본문 여백, 푸터 구분선을 맞춘다.
- 카드 드롭다운은 구버전 메뉴 순서와 divider 배치를 우선 참고한다.
- 모달은 구버전 `pf-c-modal-box` 화면처럼 둥근 흰색 박스, 상단 닫기 버튼, 본문 설명, 하단 실행/취소 버튼 구조를 유지한다.
- 경고 문구는 PatternFly Alert를 무조건 쓰지 않고, 구버전처럼 경고 아이콘과 문구가 본문에 자연스럽게 들어가는 방식을 우선한다.
- React/PatternFly 6 컴포넌트를 사용하되, 시각 결과가 구버전 ABLESTACK UI와 다르면 CSS override 또는 전용 wrapper로 보정한다.

## 현재 기준 프로젝트 분석

### ablecube-react

- 현재 이미 `React 18`, `@patternfly/react-core 6.4.0` 기반이다.
- 현 구조는 대략 다음 단위로 나뉜다.
  - `src/cards`: 상태 카드
  - `src/status`: 상태 요약 페이지
  - `src/wizard`: 주요 마법사 화면
  - `src/header.tsx`, `src/common.ts`, `src/hooks/*`: 공통 진입 로직 일부 존재
- 즉 완전히 새로 만드는 것보다, 현재 React 구조를 유지하면서 구버전 기능을 단계적으로 이식하는 방향이 맞다.

### ablestack-cockpit-plugin

- 구버전은 Cockpit 플러그인 구조이며, `HTML + PatternFly6 + jQuery + cockpit API + Python/Shell 백엔드 호출` 방식이다.
- 화면/기능은 주로 `src/features` 아래에 존재한다.
- 공통 자원은 다음에 퍼져 있다.
  - `src/common/wizard-common.js`
  - `src/common/validation.js`
  - `src/common/logger.js`
  - `index.js`의 초기 진입 분기
- 실제 기능 분류는 대략 다음과 같다.
  - 메인 진입 및 권한/호스트 분기
  - 상태 카드
  - 클러스터 준비 마법사
  - 스토리지 구성 마법사
  - 클라우드 VM 배포/변경
  - 스토리지 VM 배포/상태/리소스 변경
  - 모니터링/Wall 관련 마법사
  - 자동 종료, DB 백업 등 부가 기능
- 구버전의 Python3 백엔드 기능은 `python/` 하위 모듈에 분산되어 있으며, 신규 구조에서는 해당 기능을 HTTP API로 노출한 뒤 React에서 service layer를 통해 호출한다.

## 재구성 원칙

### 1. 화면 우선순위

우선 기존 `ablecube-react`에 이미 존재하는 화면과 직접 대응되는 구버전 기능부터 맞춘다.

1. 메인 상태 화면
2. 상태 카드
3. 클러스터 준비 마법사
4. GFS/스토리지 구성 마법사
5. 클라우드 VM 배포 마법사
6. 스토리지 VM 배포 마법사
7. 모니터링 센터 마법사
8. 구버전 부가 기능 이관

### 2. jQuery 패턴 제거 원칙

구버전의 아래 패턴은 React 방식으로 치환한다.

- `$('#id').load(...)` → 라우팅 또는 조건부 렌더링
- DOM 직접 제어 → React state / props
- jQuery validation → React form state + 공통 validation 유틸
- 전역 `sessionStorage` 의존 → 공통 context 또는 state service
- HTML 조합 화면 → PatternFly page / form / wizard / card 조합

### 3. 공통화 원칙

중복 금지 대상은 명확히 분리한다.

- 공통 API 호출 래퍼
- Cockpit bridge / backend command 호출 래퍼
- 공통 에러 처리
- 공통 로딩 상태 처리
- 공통 폼 validation
- 공통 wizard step metadata
- 공통 상태 카드 레이아웃
- 공통 alert / toast / modal
- 공통 label-value 표시 컴포넌트
- 공통 서버/클러스터 데이터 포맷터

### 4. 백엔드 호출 전환 원칙

구버전의 Python3 백엔드 호출은 API 계층으로 전환한다.

- React 컴포넌트에서 Python 스크립트 경로나 shell command를 직접 알지 않게 한다.
- 화면은 `services/api`의 함수만 호출한다.
- Python3 백엔드는 기능별 HTTP endpoint로 노출한다.
- API 응답은 React에서 쓰기 쉬운 JSON 형태로 표준화한다.
- API 에러는 공통 에러 형식으로 통일한다.
- 긴 작업은 동기 응답보다 작업 ID 기반 진행 상태 조회 방식을 우선 검토한다.

예상 API 원칙:

- `GET`은 상태 조회
- `POST`는 생성/실행
- `PUT` 또는 `PATCH`는 설정 변경
- `DELETE`는 제거
- 응답은 `{ "result": "ok", "data": ... }` 또는 `{ "result": "error", "message": ... }` 형태로 통일

API 소스 기준 저장소:

- API 백엔드 소스는 로컬 경로 `/root/ablestack-API`를 기준으로 확인한다.
- UI 작업 중 endpoint, request/response schema, 에러 응답 필드, route handler, 테스트 확인이 필요하면 GitHub 웹보다 `/root/ablestack-API` 로컬 소스를 우선 조회한다.
- API 소스가 오래되었을 가능성이 있거나 실제 최신 endpoint 확인이 필요하면 `/root/ablestack-API`에서 `git pull`로 최신화한 뒤 확인한다.
- `ablecube-react` 안에 API 저장소를 복사하거나 vendoring하지 않는다.

API 분석 및 UI 반영 기준:

- 작업 중 "api"라고 표현하면 `/root/ablestack-API`의 백엔드 소스를 기준으로 해석한다.
- 기능 구현 전에 사용할 endpoint, HTTP method, request body/query, response schema, 성공/실패 판정 조건, 에러 메시지 필드를 먼저 분석한다.
- 분석 결과는 "어떤 API를 호출하면 어떤 결과 값이 반환되는지"와 "그 값을 `ablecube-react` 화면 state/props/service 타입에 어떻게 매핑할지"까지 함께 정리한다.
- React 화면은 분석된 API를 `src/services/api/*` 함수로 감싸서 호출하고, 컴포넌트는 service 함수와 typed result만 사용한다.
- 최종 목표는 분석에 그치지 않고 `ablecube-react` 화면에서 실제 API 연동 기능이 동작하도록 구현하는 것이다.

## 목표 구조

`ablecube-react/src`는 아래 방향으로 정리한다.

```text
src/
  app/
    routes/
    layout/
    providers/
  components/
    common/
    cards/
    forms/
    wizards/
  features/
    dashboard/
    cluster/
    storage/
    cloud-vm/
    storage-vm/
    monitoring/
    maintenance/
  hooks/
  services/
    api/
    backend/
    mappers/
  utils/
    validation/
    formatters/
    constants/
  styles/
```

## 구버전 기능 매핑 초안

### 메인/진입

- 구버전
  - `index.js`
  - `main.html`
  - `main-glue.html`
  - `main-glue-no-permission.html`
- React 목표
  - 호스트명/권한/OS 타입 기반 진입 분기 로직을 `app/providers` 또는 `services/cockpit/session`으로 이동
  - 화면 분기는 라우트 또는 상위 layout 조건 렌더링으로 처리

### 상태 카드

- 구버전
  - `card-cloud-cluster-status.js`
  - Python status modules
- React 현재
  - `src/cards/*`
- 작업 방향
  - 카드별 데이터 요청 형식 표준화
  - 상태 카드 데이터 조회는 `src/hooks/useStatusPolling.ts`의 공통 폴링 훅을 사용하고, 기본 재수집 주기는 10초로 둔다.
  - 상태 카드 재수집 주기는 `cube.conf`의 `DEFAULT_STATUS_CARD_REFRESH_INTERVAL_SECONDS` 값으로 변경할 수 있으며, 값 단위는 초이다.
  - 상태 카드 재수집 중에는 기존 상세 값을 유지하되, 상태 라벨/푸터는 로딩 아이콘과 `상태 체크 중...` 문구를 표시하고 응답 후 실제 상태로 되돌린다.
  - 앞으로 추가되는 상태 카드는 별도 `setInterval`/`useEffect`를 직접 만들지 않고 공통 폴링 훅에 `fetcher`, `fallback`, 필요 시 성공/오류 콜백만 전달한다.
  - `GFS 통합 상태` 카드는 `/api/v1/cube/gfs/resource/status`와 `/api/v1/cube/gfs/disk/status` 결과를 합쳐 펜스/잠금/마운트 상태를 표시한다.
  - `로컬 디스크 상태` 카드는 `POST /api/v1/cube/local/manage`에 `{ "action": "local-disk-status" }`를 보내고, `status`, `mount_path`, `pv`, `vg`, `size`를 카드 필드로 매핑한다.
  - GFS 통합/로컬 디스크 카드의 드롭다운 액션은 구버전 메뉴 기준으로 버튼과 확인 모달을 우선 배치하고, 실행 함수는 후속 API 액션 분석 후 `services/api`에 연결한다.
  - 공통 카드 프레임 컴포넌트 도입
  - 동일 상태/에러/빈값 표시 로직 통일

### 카드별 드롭다운 액션 모달

- 구버전
  - `main.html`의 카드별 dropdown menu
  - `src/features/main.js`의 메뉴 click handler
  - `src/features/*-update.html`, `auto-shutdown.html` 등 분리된 modal HTML
- React 목표
  - 카드 드롭다운 메뉴는 카드 컴포넌트에서 정의하되, 실제 액션 실행 흐름은 `ActionModal` 계층으로 분리한다.
  - `ablestack-cockpit-plugin`의 모달 문구, 확인 절차, 체크박스, 목록 선택, 위험 작업 확인 흐름을 먼저 분석한 뒤 React/PatternFly 6 구조로 재구성한다.
- 메뉴 클릭 시 바로 실행하지 않는다. 구버전과 동일하게 모달에서 사용자가 확인/선택/체크한 뒤 실행한다.
- Python/Shell command 명령어는 React modal이 알지 않도록 하고, `services/api`의 액션 함수에만 매핑한다.
- 팝업 안에서 목록을 보여주는 액션은 하드코딩 샘플을 두지 않고, 모달이 열릴 때 API로 최신 데이터를 조회한다.
- `WWN 목록 조회`는 `POST /api/v1/cube/hba/manage`의 `list-hba-wwn` 결과를 표시한다.
- `GFS 디스크 추가/확장 후보`, `CLVM 디스크 추가 후보`, `로컬 디스크 구성 후보`는 `GET /api/v1/cube/disk?action=gfs` 결과를 표시한다.
  - 2026-06-05 확인: 현재 API 호스트 `10.10.32.2:8090`의 `action=gfs` 실제 응답은 `/dev/sdb`~`/dev/sdf`와 RBD 장치가 포함되며, 기존 샘플 `/dev/mapper/mpathb`, `/dev/mapper/mpathc` 값은 반환되지 않는다.
  - 2026-06-05 확인: API 호스트를 `10.10.12.2:8090`로 변경하면 `action=gfs` 실제 응답은 top-level `/dev/mapper/mpatha` 아래 `mpatha1` 파티션과 LVM이 달린 구조로 반환된다.
  - GFS/CLVM/로컬 디스크 후보 UI에서는 API 응답에 RBD 장치가 섞여 내려와도 물리/공유 디스크 후보로 노출하지 않도록 RBD 계열을 제외한다.
  - GFS/CLVM/로컬 디스크 후보 UI에서는 `part`, `lvm` 장치를 후보로 노출하지 않고, 파티션이 존재하는 top-level `disk`/`mpath` 장치는 선택 불가 상태로 표시한다.
- `GFS 디스크 삭제/확장/상세 정보`는 `GET /api/v1/cube/gfs/disk/status` 결과를 표시한다.
- `CLVM 디스크 삭제/정보`는 `POST /api/v1/cube/clvm/manage`의 `list-clvm` 결과를 표시한다.
- `디스크 이미지 삭제`는 `GET /api/v1/cube/disk?action=rbd` 결과를 표시한다.
- `클라우드센터VM 스냅샷 복구`는 `POST /api/v1/cube/ccvm/snap`의 `list` 결과를 선택 목록으로 표시한다.
- 2026-06-18 반영: 카드 액션 중 API가 확인된 항목은 React `services/api` 호출로 연결했다.
  - GFS 펜스 유지보수 설정/해제: `POST /api/v1/cube/gfs/manage`의 `check-stonith` + `security-disable|security-enable`
  - GFS 디스크 삭제/확장/새 LUN 추가 확장: `delete-gfs`, `extend`, `add-extend`
  - CLVM 디스크 추가/삭제: `POST /api/v1/cube/clvm/manage`의 `create-clvm`, `delete-clvm`
  - GFS용 RBD 이미지 추가/삭제: `POST /api/v1/cube/rbd/manage`의 `create`, `delete`
  - 외부 스토리지 재검색: `POST /api/v1/cube/gfs/manage`의 `scan`
  - 클라우드센터VM 스냅샷 백업/복구, Mold 서비스/DB 제어, 자원변경, secondary resize, 즉시 DB 백업을 API로 연결했다.
  - 스토리지센터VM 시작/정지/삭제/자원변경과 전체 시스템 자동 종료 절차를 API로 연결했다.
  - 클라우드센터 클러스터 시작/정지/클린업/마이그레이션/구성, SSH Port 변경, 클라우드센터/모니터링센터 URL 연결을 API로 연결했다.
  - API가 불명확하거나 추가 입력 화면이 필요한 `GFS 디스크 추가`, `외부 스토리지 동기화`, `호스트 제거`, `정기 DB 백업/삭제 관리`, `모니터링센터 구성/수집 정보 업데이트`는 콘솔 실행 대신 사용자 안내 모달로 처리한다.

### 상단 리본 액션 버튼

- 구버전 `ablestack-cockpit-plugin/main.html` 기준 상단 리본 버튼은 다음 전체 목록을 기준으로 한다.
  - 클러스터 구성 준비
  - 스토리지센터 VM 배포
  - 클라우드센터 VM 배포
  - 스토리지센터 대시보드 연결
  - GFS 스토리지 구성
  - HCI 공유 파일 구성
  - 로컬 스토리지 구성
  - 클라우드센터 연결
  - 모니터링센터 구성
  - 모니터링센터 대시보드 연결
  - 설정파일 다운로드
  - 라이센스 관리
  - 보안 업데이트
  - ABLESTACK Version 업데이트
- `스토리지센터 대시보드 연결`, `클라우드센터 연결`, `모니터링센터 대시보드 연결`은 `GET /api/v1/cube/url?option=storageCenter|cloudCenter|wallCenter` 결과를 사용한다.
- 2026-06-05 확인: `10.10.12.2:8090` 기준 `cloudCenter`, `wallCenter`는 URL을 반환하고, `storageCenter`는 현재 cluster type에서 `unsupported cluster type`을 반환한다.
- HCI 공유 파일 구성, 보안 업데이트, ABLESTACK Version 업데이트는 구버전 버튼을 React 상단 리본에 노출하되, 세부 실행 화면/API 연결은 후속 이관 대상으로 둔다.
- 2026-06-05 반영: `로컬 스토리지 구성`은 구버전 `local-storage-configure-wizard.html/js` 흐름을 기준으로 React wizard로 이관했다.
  - 단계: 개요 → 로컬 디스크 구성 → 설정확인 → 배포 → 완료
  - 디스크 후보: `GET /api/v1/cube/disk?action=gfs`를 `fetchGfsDiskCandidates()`로 조회
  - 배포 실행: `POST /api/v1/cube/local/manage`의 `reset` 실행 후 `create-local-disk` 실행
  - 파티션이 존재하는 후보는 선택 불가 상태로 표시하고, 선택한 디스크만 `disks` 배열로 전달한다.
- 2026-06-05 반영: `설정파일 다운로드` 팝업은 로컬 파일 직접 읽기 대신 API 기준 다운로드로 전환했다.
  - SSH Key: `POST /api/v1/cube/ssh/key` body `{"action":"download"}`를 호출한다. API는 private/public key 개별 파일이 아니라 AES-GCM 암호화 단일 `.dat` 번들을 반환한다.
  - Cluster.json: 전체 원본 `cluster.json` 다운로드 API는 현재 `/root/ablestack-API`에서 확인되지 않아, `GET /api/v1/cube/cluster/config`와 `GET /api/v1/cube/system/config` 응답을 조합해 `cluster.json`으로 내려준다.
  - React 구현은 브라우저 직접 `fetch` 대신 Cockpit 세션의 `curl` 호출을 사용해 Cockpit HTTPS 화면과 API HTTP 주소 간 혼합 콘텐츠 영향을 피한다.
- 2026-06-05 반영: `라이센스 관리` 팝업은 구버전 `register_license.py` 직접 실행 대신 `POST /api/v1/cube/license` API로 전환했다.
  - 상태 조회: body `{"action":"status"}`. `code=200`이면 `val.status/issued/expired/oem`을 표시하고, `code=404`는 미등록 상태로 표시한다.
  - 등록 실행: 선택한 라이센스 파일을 base64로 읽어 body `{"action":"register","license_content":"...","original_filename":"..."}`로 전달한다.
  - 등록 성공 후 현재 팝업 안에서 라이센스 상태를 다시 조회한다.

#### 공통화 대상

아래 패턴은 카드가 달라도 반복될 가능성이 높으므로 공통 컴포넌트로 만든다.

- 단순 확인 모달
  - 예: "진행하시겠습니까?", "변경하시겠습니까?"
  - 목표 파일: `src/components/common/action-modal/ConfirmActionModal.tsx`
- 위험 작업 확인 모달
  - 경고 아이콘, 경고 문구, 확인 체크박스, 실행 버튼 비활성화 패턴
  - 목표 파일: `src/components/common/action-modal/DangerConfirmActionModal.tsx`
- 선택 목록 모달
  - 체크박스 목록, 테이블 목록, 선택 항목 없을 때 실행 버튼 비활성화
  - 목표 파일: `src/components/common/action-modal/SelectableActionModal.tsx`
- 읽기 전용 정보 모달
  - WWN 목록, 디스크 정보처럼 확인 버튼만 필요한 조회 결과
  - 목표 파일: `src/components/common/action-modal/InfoListModal.tsx`
- 액션 결과 표시
  - 성공/실패/진행중/명령 매핑 표시
  - 목표 파일: `src/components/common/action-modal/ActionResultNotice.tsx`
- 모달 공통 타입
  - title, description, warning, confirmLabel, cancelLabel, execute handler, loading state
  - 목표 파일: `src/components/common/action-modal/types.ts`

#### 단일 전용 파일 대상

아래처럼 특정 카드나 업무 흐름에 강하게 묶인 모달은 공통 컴포넌트로 억지 분리하지 않고 기능 단위 전용 파일로 만든다.

- 스토리지센터 클러스터 유지보수 모드 변경
  - 설정/해제에 따라 문구와 API payload가 달라진다.
  - 목표 파일: `src/features/storage/modals/StorageClusterMaintenanceModal.tsx`
- 스토리지센터 클러스터 액션 묶음
  - 스토리지센터 연결, Glue 업데이트, 외부 스토리지 동기화/재검색, CLVM 추가/삭제/정보, WWN 목록, 전체 시스템 종료, Cube 호스트 제거
  - 목표 파일: `src/features/storage/modals/StorageClusterActionModal.tsx`
- 전체 시스템 자동 종료
  - 단순 실행이 아니라 단계별 진행, Mount 해제 확인, VM/클러스터/호스트 종료 순서가 필요하다.
  - 목표 파일: `src/features/maintenance/modals/AutoShutdownModal.tsx`
- CLVM 디스크 추가/삭제/정보
  - 디스크 목록 데이터 구조와 선택 payload가 특수하다.
  - 공통 선택 모달을 사용하되, 데이터 변환/표시 조합은 `src/features/storage/modals/ClvmDiskActionModal.tsx`로 분리한다.
- Cloud VM, Storage VM, Mold service, Mold DB 등 VM 제어 모달
  - VM 상태/스냅샷/백업/마이그레이션 같은 업무별 상태 전이가 있어 기능별 전용 파일로 둔다.

#### 권장 파일 구조

```text
src/
  components/
    common/
      action-modal/
        ConfirmActionModal.tsx
        DangerConfirmActionModal.tsx
        SelectableActionModal.tsx
        InfoListModal.tsx
        ActionResultNotice.tsx
        types.ts
        index.ts
  features/
    storage/
      modals/
        StorageClusterMaintenanceModal.tsx
        StorageClusterActionModal.tsx
        ClvmDiskActionModal.tsx
      services/
        storage-cluster-api.ts
        storage-cluster-mappers.ts
    maintenance/
      modals/
        AutoShutdownModal.tsx
```

#### 구현 기준

- 먼저 구버전 modal HTML과 click handler를 확인하고, React 파일 생성 전에 기능별 입력/출력/확인 조건을 정리한다.
- 공통 컴포넌트는 "모양"과 "기본 동작"만 담당한다.
- 카드/기능 전용 파일은 데이터 조회, payload 생성, API 함수 호출, 결과 처리만 담당한다.
- 공통 컴포넌트가 특정 도메인 용어를 알면 안 된다. 예를 들어 `CLVM`, `WWN`, `Cube`라는 이름은 공통 컴포넌트에 넣지 않는다.
- 단일 전용 파일은 재사용성이 낮아도 읽기 쉬운 흐름을 우선한다.
- 하나의 파일에 모든 카드 액션 모달을 몰아넣지 않는다. 액션 수가 늘어나면 카드별 또는 기능별 modal 파일로 분리한다.
- 실행 결과는 카드 내부 inline alert 또는 전역 toast 중 하나로 통일하되, 긴 작업은 작업 진행 모달/상태 조회 패턴을 사용한다.

### Wizard 계열

- 구버전
  - `cluster-config-prepare.js`
  - `gfs-storage-configure-wizard.js`
  - `cloud-vm-wizard.js`
  - `storage-vm-wizard.js`
  - `wall-monitoring-wizard.js`
- React 현재
  - `src/wizard/*`
- 작업 방향
  - 각 wizard의 step 정의를 데이터 구조로 분리
  - 공통 step footer / validation / next-prev action 분리
  - backend 호출을 화면 코드에서 떼고 service layer로 이동

#### 스토리지센터 가상머신 배포 마법사 기준

- 구버전 기준 파일은 `src/features/storage-vm-wizard.html`, `src/features/storage-vm-wizard.js`로 본다.
- 단계 구성은 `개요 -> 가상머신 장치 구성(컴퓨트/디스크/네트워크) -> 추가 네트워크 정보 -> SSH Key 정보 -> 설정확인 -> 배포 -> 완료` 흐름을 유지한다.
- 컴퓨트 단계는 CPU, Memory, ROOT Disk 150 GiB 정보를 표시하고, 구버전 참고 문구를 유지한다.
- 디스크 단계는 `PCI Passthrough`, `LUN Passthrough` 선택에 따라 대상 디스크 체크박스 목록을 보여준다.
- 네트워크 단계는 `관리 NIC용 Bridge`, `NIC Passthrough`, `NIC Passthrough Bonding`, `Bridge Network` 구성을 지원한다.
- 추가 네트워크 정보 단계는 클러스터 구성 프로파일, 현재 호스트명, SCVM 호스트명, 관리/서버/복제 IP, CCVM 관리 IP 항목을 구버전 필드명에 맞춘다.
- 설정확인 단계는 가상머신 장치 구성, 추가 네트워크 정보, SSH Key 정보를 구버전 아코디언 구성처럼 묶어 보여준다.
- 배포 버튼은 즉시 실행하지 않고 구버전과 동일하게 `스토리지센터 가상머신 배포 진행` 확인 모달을 거친다.
- 취소 버튼과 닫기 버튼은 입력 초기화를 안내하는 취소 확인 모달을 거친다.
- 실제 Python 호출은 React에서 직접 하지 않고 추후 `services/api`의 스토리지 VM 배포 API로 대체한다.

#### 클라우드센터 VM 배포 마법사 기준

- 구버전 기준 파일은 `src/features/cloud-vm-wizard.html`, `src/features/cloud-vm-wizard.js`로 본다.
- 단계 구성은 `개요 -> 클라우드센터 VM 설정(컴퓨트/네트워크) -> 추가 네트워크 정보 -> SSH Key 정보 -> 장애조치 클러스터 설정 -> 설정확인 -> 배포 -> 완료` 흐름을 유지한다.
- `클러스터 민감도(초)`는 컴퓨트 단계의 공통 필드가 아니라, 구버전처럼 `ablestack-vm` 타입에서만 노출되는 `클러스터 민감도` 하위 단계로 처리한다.
- 네트워크 단계는 구버전처럼 `관리네트워크`는 필수 체크 상태로 두고, `서비스네트워크`는 체크박스로 활성화하며 서비스 Bridge와 서비스 IP 입력 상태가 함께 변경되도록 한다.
- 추가 네트워크 정보 단계는 클러스터 구성 프로파일, 현재 호스트명, CCVM 호스트명, 관리/서비스 NIC IP/Gateway/DNS 항목을 구버전 필드명 기준으로 맞춘다.
- SSH Key 단계는 파일 선택 후 textarea 미리보기 구조를 유지하되, API 전환 전에는 현재 호스트 SSH Key 자동 사용 문구를 기본값으로 표시한다.
- 장애조치 클러스터 단계는 클러스터 멤버 수에 따라 PCS 호스트 PN IP 입력 필드를 동적으로 구성한다.
- 설정확인 단계는 클라우드센터 VM 설정, 추가 네트워크 정보, SSH Key 정보, 장애조치 클러스터 설정을 구버전 아코디언 구성처럼 묶어 보여준다.
- 배포 버튼은 즉시 실행하지 않고 구버전과 동일하게 `클라우드센터 가상머신 배포 진행` 확인 모달을 거친다.
- 취소 버튼과 닫기 버튼은 입력 초기화를 안내하는 취소 확인 모달을 거친다.
- 실제 Python 호출은 React에서 직접 하지 않고 추후 `services/api`의 클라우드센터 VM 배포 API로 대체한다.

#### GFS 스토리지 구성 마법사 기준

- 구버전 기준 파일은 `src/features/gfs-storage-configure-wizard.html`, `src/features/gfs-storage-configure-wizard.js`로 본다.
- 단계 구성은 `개요 -> 외부 스토리지 동기화 -> GFS 디스크 구성 -> IPMI 정보 -> 설정확인 -> 배포 -> 완료` 흐름을 유지한다.
- 외부 스토리지 동기화 단계에서 `이중화`를 선택하면 동기화 완료 전 다음 단계 이동을 제한한다.
- GFS 디스크 구성 단계는 `disk_action.py gfs-list` 결과를 API로 받은 뒤 체크박스 목록으로 표시하는 것을 목표로 한다.
- IPMI 정보는 `공통 자격 증명`, `개별 자격 증명`을 구분하고, 호스트 수에 따라 IPMI IP/아이디/비밀번호 입력 필드를 동적으로 구성한다.
- 설정확인 단계는 외부 스토리지 동기화 방식, GFS 디스크, IPMI 정보를 구버전 아코디언 구성처럼 묶어 보여준다.
- 배포 버튼은 즉시 실행하지 않고 구버전과 동일하게 `GFS 스토리지 구성 진행` 확인 모달을 거친다.
- 취소 버튼과 닫기 버튼은 입력 초기화를 안내하는 취소 확인 모달을 거친다.
- 실제 Python 호출은 React에서 직접 하지 않고 추후 `services/api`의 GFS 구성 API로 대체한다.

#### Wall 모니터링 구성 마법사 기준

- 구버전 기준 파일은 `src/features/wall-monitoring-wizard.html`, `src/features/wall-monitoring-wizard.js`로 본다.
- 단계 구성은 `개요 -> 모니터링 대상 IP 설정 -> 알림 SMTP 설정 -> 설정확인 -> 배포 -> 완료` 흐름을 유지한다.
- 모니터링 대상 IP 설정 단계는 호스트 수, CCVM 관리 IP, Cube 관리 IP, SCVM 관리 IP를 구버전 필드명에 맞춘다.
- `ablestack-vm`, `ablestack-standalone` 타입에서는 구버전처럼 SCVM 입력 영역을 숨기고, `ablestack-hci`, `ablestack-hci-filesystem` 타입에서만 SCVM 입력/검증을 수행한다.
- SMTP 설정은 선택사항이며, 체크 해제 시 SMTP 서버, Port, 관리자 이메일, 비밀번호 값을 초기화하고 입력을 비활성화한다.
- 수신 이메일 주소 필드는 구버전에서 주석 처리된 항목이므로 React 화면에서도 제외한다.
- 설정확인 단계는 모니터링 대상 IP 설정, 알림 SMTP 설정을 구버전 아코디언 구성처럼 묶어 보여준다.
- 구성 버튼은 즉시 실행하지 않고 구버전과 동일하게 `모니터링센터 대시보드 구성 진행` 확인 모달을 거친다.
- 취소 버튼과 닫기 버튼은 입력 초기화를 안내하는 `Wall 모니터링센터 VM 구성 취소` 확인 모달을 거친다.
- 실제 Python 호출은 React에서 직접 하지 않고 추후 `services/api`의 Wall 모니터링 구성 API로 대체한다.

### 부가 기능

- 구버전
  - `auto-shutdown`
  - `cloud-vm-dbbackup`
  - `storage-vm-resource-update`
  - `storage-vm-status-update`
  - `storage-cluster-maintenance-update`
- React 목표
  - 운영 기능은 기능 단위 page 또는 modal로 분리
  - 공통 action panel 패턴으로 통일

## 구현 단계

### Phase 1. 구조 정리

- 현재 `src` 구조를 기능 기반으로 재배치한다.
- `services`, `utils`, `components/common` 계층을 먼저 만든다.
- 기존 `common.ts`, hook, 카드/마법사에서 공통으로 쓰는 부분을 식별한다.
- 진입 분기 로직을 별도 서비스로 추출한다.

### Phase 2. 공통 레이어 구축

- API 호출 공통 래퍼 작성
- 공통 API 에러 객체 정의
- 공통 loading / empty / error UI 컴포넌트 작성
- 공통 validation 함수 작성
- 공통 wizard shell 작성
- 구버전 Python3 모듈별 API endpoint 매핑표 작성
- 긴 작업 실행/진행 상태 조회 패턴 정의

### Phase 3. 상태 화면 정리

- 현재 상태 카드와 상태 페이지를 공통 카드 컴포넌트 기준으로 재정리
- 구버전 Python status 데이터와 React 카드 props를 매핑
- 카드 데이터 fetch 패턴을 `useStatusPolling` 기준으로 통일하고 `cube.conf` 설정이 없을 때 기본 10초 재수집 주기를 유지
- 카드별 dropdown action과 modal 동작을 구버전 기준으로 다시 매핑
- 공통 action modal 컴포넌트와 기능별 전용 modal 파일을 분리

### Phase 4. 카드 액션 모달 이관

- `src/components/common/action-modal` 공통 모달 컴포넌트 작성
- `src/features/*/modals` 기능별 전용 모달 작성
- 기존 카드 내부에 직접 작성된 modal JSX를 전용 파일로 이동
- 메뉴 클릭, 모달 확인, API 실행, 결과 표시 흐름을 표준화
- 구버전 modal 문구/확인 조건/버튼 상태를 React state 기반으로 재구성

### Phase 5. Wizard 이관

- `cluster-config-prepare`
- `gfs-storage-configure`
- `cloud-vm-deploy`
- `storage-vm-deploy`
- `monitoring-center`

순서로 각 wizard를 재구성한다.

### Phase 6. 부가 기능 이관

- 자동 종료
- DB 백업
- 리소스 수정
- 상태 업데이트
- 유지보수 관련 기능

### Phase 7. 마감 정리

- 중복 함수 제거
- 미사용 스타일 제거
- 공통 컴포넌트 문서화
- README 및 개발 규칙 정리

### Phase 8. Python3 백엔드 API 전환

- `ablestack-cockpit-plugin/python` 하위 기능을 기능 도메인별로 분류한다.
- 기존 스크립트 입출력 값을 API request/response schema로 정리한다.
- React 화면은 API client를 통해서만 백엔드 기능을 호출한다.
- API endpoint와 React service 함수의 1:1 매핑을 문서화한다.
- 기존 shell/python 직접 호출 방식은 React 코드에서 제거한다.

## 공통 함수/공통 컴포넌트 분리 기준

아래 조건 중 하나라도 만족하면 분리한다.

- 동일한 backend 호출 패턴이 2회 이상 반복됨
- 동일한 PatternFly form field 묶음이 2회 이상 반복됨
- wizard step validation이 2회 이상 반복됨
- alert/toast/modal 처리 방식이 2회 이상 반복됨
- label/value 표시 패턴이 2회 이상 반복됨
- status card 프레임이 2회 이상 반복됨

예상 공통화 대상:

- `apiGet()`
- `apiPost()`
- `apiPatch()`
- `apiDelete()`
- `buildApiError()`
- `parseClusterConfig()`
- `buildWizardStepState()`
- `validateRequiredFields()`
- `StatusCardShell`
- `AsyncPageState`
- `LabelValueList`
- `WizardActionBar`

## 개발 규칙

- 신규 화면은 PatternFly 6 컴포넌트 조합으로만 작성한다.
- jQuery, 직접 DOM 조작, 인라인 문자열 HTML 조합은 추가하지 않는다.
- 화면 컴포넌트에서 backend 호출을 직접 구현하지 않고 `services` 계층으로 분리한다.
- 상태 카드의 주기적 조회는 공통 `useStatusPolling` 훅을 사용하며, 별도 사유가 없으면 `cube.conf`의 `DEFAULT_STATUS_CARD_REFRESH_INTERVAL_SECONDS` 또는 기본 10초 주기를 사용한다.
- React 컴포넌트에서 Python3 스크립트나 shell command를 직접 호출하지 않는다.
- Python3 백엔드 기능은 API endpoint를 통해 호출한다.
- 중복 로직은 구현 즉시 공통 함수로 올리는 것을 기본 원칙으로 한다.
- 구버전 기능 복제보다 React 구조에 맞는 재설계를 우선한다.

## 첫 작업 항목

1. `ablecube-react` 현재 구조 기준으로 `services`, `components/common`, `features` 재배치안 확정
2. 구버전 `src/features`와 React `src/wizard`, `src/cards`, `src/status`의 1:1 대응표 작성
3. 진입 분기, 공통 validation, backend 호출 공통 래퍼 초안 작성
4. 이후 화면별 이관 개발 착수
5. `ablestack-cockpit-plugin/python` 기능을 API endpoint 후보로 분류
