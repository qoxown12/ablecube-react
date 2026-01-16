# ABLESTACK Cube

Cube에 ABLESTACK 관리기능을 제공합니다.


# Development dependencies

On Fedora:

    sudo dnf -y install git gcc gcc-c++ make autoconf automake libtool intltool \
        glib2-devel libxslt-devel libmount-devel pam-devel \
        systemd-devel json-glib-devel gnutls-devel krb5-devel \
        nodejs npm xmlto rpm-build


# Getting and building the source

이 명령어들은 소스 코드를 가져와(checkout) dist/ 디렉터리로 빌드하는 작업을 수행합니다.

```
git clone https://github.com/qoxown12/ablecube-react.git
cd ablecube-react
make
```

# Installing
개발 시에는 일반적으로 git 트리에서 바로 모듈을 실행하고 싶을 때가 많습니다. 이를 위해서는 make devel-install을 실행하면, 체크아웃한 코드를 cockpit-bridge가 패키지를 찾는 위치에 심볼릭 링크로 연결합니다.
수동으로 하고 싶다면:

```
mkdir -p ~/.local/share/cockpit
ln -s `pwd`/dist ~/.local/share/cockpit/ablestack
```

코드를 변경한 뒤 `make` 또는 `./build.js` 를 실행하고, 브라우저에서 Cockpit 페이지를 새로고침하세요.

watch mode를 사용하면 코드 변경 시마다 번들이 자동으로 다시 생성됩니다.

    npm run watch

로컬에 설치된 버전을 제거하려면 make devel-uninstall을 실행하거나 심볼릭 링크를 직접 제거하십시오.

    rm ~/.local/share/cockpit/ablestack

# Running eslint

Cockpit Files는 .js 및 .jsx 파일의 JavaScript 코드 스타일을 자동으로 검사하기 위해 ESLint를 사용합니다.

개발자 편의를 위해 ESLint를 다음 명령으로 직접 실행할 수도 있습니다:

    npm run eslint

일부 규칙 위반은 다음 명령을 통해 자동으로 수정할 수 있습니다:

    npm run eslint:fix

규칙 설정은 `.eslintrc.json` 파일에서 확인할 수 있습니다

## Running stylelint

Cockpit은 .css 및 .scss 파일의 CSS 코드 스타일을 자동으로 검사하기 위해 Stylelint를 사용합니다.

개발자 편의를 위해 Stylelint를 다음 명령으로 직접 실행할 수도 있습니다:

    npm run stylelint

일부 규칙 위반은 다음 명령을 통해 자동으로 수정할 수 있습니다:

    npm run stylelint:fix

규칙 설정은 `.stylelintrc.json` 파일에서 확인할 수 있습니다

## rpm build

RPM을 생성하려면 `sh rpm-builder.sh` 를 실행하세요.
빌드가 완료되면 결과물은 ./rpmbuild/RPMS/noarch/ 경로에 생성됩니다.
