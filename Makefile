# extract name from package.json
PACKAGE_NAME := $(shell awk '/"name":/ {gsub(/[",]/, "", $$2); print $$2}' package.json)
RPM_NAME := cockpit-$(PACKAGE_NAME)
VERSION := $(shell T=$$(git describe 2>/dev/null) || T=1; echo $$T | tr '-' '.')
PREFIX ?= /usr/local

APPSTREAMFILE = io.ablecloud.ablestack.metainfo.xml

# test stamp files
NODE_MODULES_TEST = package-lock.json
DIST_TEST = runtime-npm-modules.txt
COCKPIT_REPO_STAMP = pkg/lib/cockpit-po-plugin.js

# common tar args
TAR_ARGS = --sort=name \
	--mtime "@$(shell git show --no-patch --format='%at' 2>/dev/null || date +%s)" \
	--mode=go=rX,u+rw,a-s --numeric-owner --owner=0 --group=0

NODE_ENV ?= production

all: $(DIST_TEST)

#
# Checkout common files from Cockpit repository
#
COCKPIT_REPO_FILES = \
	pkg/lib \
	test/common \
	tools/build-debian-copyright

COCKPIT_REPO_URL = https://github.com/cockpit-project/cockpit.git
COCKPIT_REPO_COMMIT = 6c4f44eeec490d66cbcaf8db0cf6eefd7eaba3b3

$(COCKPIT_REPO_FILES): $(COCKPIT_REPO_STAMP)

COCKPIT_REPO_TREE = $(COCKPIT_REPO_COMMIT)^{tree}

$(COCKPIT_REPO_STAMP): Makefile
	@git rev-list --quiet --objects $(COCKPIT_REPO_TREE) -- 2>/dev/null || \
		git fetch --no-tags --no-write-fetch-head --depth=1 \
		$(COCKPIT_REPO_URL) $(COCKPIT_REPO_COMMIT)
	git archive $(COCKPIT_REPO_TREE) -- $(COCKPIT_REPO_FILES) | tar x

#
# i18n
#
LINGUAS = $(basename $(notdir $(wildcard po/*.po)))

po/$(PACKAGE_NAME).js.pot:
	xgettext --default-domain=$(PACKAGE_NAME) --output=- \
		--language=C --keyword=_ --from-code=UTF-8 \
		$$(find src/ -name '*.[jt]s*') > $@

po/$(PACKAGE_NAME).html.pot: $(COCKPIT_REPO_STAMP)
	pkg/lib/html2po -o $@ $$(find src -name '*.html')

po/$(PACKAGE_NAME).manifest.pot: $(COCKPIT_REPO_STAMP)
	pkg/lib/manifest2po -o $@ src/manifest.json

po/$(PACKAGE_NAME).metainfo.pot: $(APPSTREAMFILE)
	xgettext --default-domain=$(PACKAGE_NAME) --output=$@ $<

po/$(PACKAGE_NAME).pot: \
	po/$(PACKAGE_NAME).js.pot \
	po/$(PACKAGE_NAME).html.pot \
	po/$(PACKAGE_NAME).manifest.pot \
	po/$(PACKAGE_NAME).metainfo.pot
	msgcat --sort-output --output-file=$@ $^

po/LINGUAS:
	echo $(LINGUAS) | tr ' ' '\n' > $@

#
# Build
#
$(DIST_TEST): $(COCKPIT_REPO_STAMP) $(shell find src/ -type f) package.json build.js $(shell find po -name '*.po')
	npm install
	NODE_ENV=$(NODE_ENV) ./build.js

#
# package-lock.json
#
package-lock.json:
	npm install --package-lock-only

#
# Install
#
install: $(DIST_TEST) po/LINGUAS
	mkdir -p $(DESTDIR)$(PREFIX)/share/cockpit/$(PACKAGE_NAME)
	cp -r dist/* $(DESTDIR)$(PREFIX)/share/cockpit/$(PACKAGE_NAME)
	mkdir -p $(DESTDIR)$(PREFIX)/share/metainfo
	msgfmt --xml -d po \
		--template $(APPSTREAMFILE) \
		-o $(DESTDIR)$(PREFIX)/share/metainfo/$(APPSTREAMFILE)

#
# Developer install (symlink)
#
devel-install: $(DIST_TEST)
	mkdir -p ~/.local/share/cockpit
	ln -sf $$(pwd)/dist ~/.local/share/cockpit/$(PACKAGE_NAME)

devel-uninstall:
	rm -f ~/.local/share/cockpit/$(PACKAGE_NAME)

#
# Dist tarball
#
TARFILE = $(RPM_NAME)-$(VERSION).tar.xz

dist: $(TARFILE)

$(TARFILE): $(DIST_TEST)
	tar --xz $(TAR_ARGS) -cf $(TARFILE) \
		--transform 's,^,$(RPM_NAME)/,' \
		$$(git ls-files | grep -v node_modules --exclude=rpmbuild) dist/

#
# Clean
#
clean:
	rm -rf dist node_modules
	rm -f $(DIST_TEST)
	rm -f po/*.pot po/LINGUAS
	rm -f $(TARFILE)

print-version:
	@echo "$(VERSION)"

.PHONY: all clean install devel-install devel-uninstall dist print-version
