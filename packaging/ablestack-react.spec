Name:           ablestack-react
Version:        1.0.0
Release:        1%{?dist}
Summary:        Ablestack Cockpit React plugin

License:        LGPL-2.1-or-later
BuildArch:      noarch

Source0:        %{name}-%{version}.tar.xz
Source1:        %{name}-dist-%{version}.tar.xz

Requires:       cockpit-bridge >= 318

%description
Ablestack Cockpit plugin built with React.
This package contains prebuilt static assets.

%prep
%setup -q
tar -xf %{SOURCE1}

%build
# nothing to build (dist is prebuilt)

%install
mkdir -p %{buildroot}%{_datadir}/cockpit/%{name}
cp -r dist/* %{buildroot}%{_datadir}/cockpit/%{name}

%files
%license LICENSE
%{_datadir}/cockpit/%{name}

%changelog
* Tue Jan 14 2026 Ablecloud <support@ablecloud.io> - 1.0.0-1
- Initial package
