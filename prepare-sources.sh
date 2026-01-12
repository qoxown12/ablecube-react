#!/usr/bin/env bash
set -euo pipefail

# -----------------------------
# Config
# -----------------------------
NAME=ablestack-react
SPEC_NAME=ablestack-react.spec

# 명시적 버전 (제품/배포용 권장)
VERSION=1.0.0

RPMTOP="$HOME/rpmbuild"
SOURCES="$RPMTOP/SOURCES"
SPECS="$RPMTOP/SPECS"

echo "==> Package : $NAME"
echo "==> Version : $VERSION"
echo "==> RPMTOP  : $RPMTOP"
echo

# -----------------------------
# 0. rpmbuild tree
# -----------------------------
mkdir -p "$RPMTOP"/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}

# -----------------------------
# 1. clean
# -----------------------------
echo "==> clean"
make clean || true

# -----------------------------
# 2. build dist via Makefile
# -----------------------------
echo "==> build dist"
make

test -d dist || { echo "dist not generated"; exit 1; }

# -----------------------------
# 3. Source0: source tarball (prefix 있음)
# -----------------------------
echo "==> create source tarball"
tar -cJf "$SOURCES/$NAME-$VERSION.tar.xz" \
  --exclude node_modules \
  --exclude dist \
  --transform "s,^,$NAME-$VERSION/," \
  .

# -----------------------------
# 4. Source1: dist tarball (prefix 없음)
# -----------------------------
echo "==> create dist tarball"
tar -cJf "$SOURCES/$NAME-dist-$VERSION.tar.xz" dist

# -----------------------------
# 5. install spec
# -----------------------------
echo "==> install spec"
sed "s/^Version:.*/Version:        $VERSION/" \
  packaging/$SPEC_NAME > "$SPECS/$SPEC_NAME"

# -----------------------------
# 6. rpmbuild
# -----------------------------
echo "==> rpmbuild"
rpmbuild -ba "$SPECS/$SPEC_NAME"

echo
echo "DONE"
echo "Generated RPMs:"
find "$RPMTOP/RPMS" -name "*.rpm" -printf "  %p\n"
