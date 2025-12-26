{
  description = "Subsonic client - A web-based music player for Subsonic/OpenSubsonic API servers";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = {
    self,
    flake-utils,
    nixpkgs,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs
            # Electron dependencies
            electron
            # Required for electron-builder
            dpkg
            fakeroot
            ruby
            fpm
            glib
          ];

          # Electron runtime dependencies
          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath (with pkgs; [
            glib
            libgbm
            libGL
            nss
            nspr
            atk
            cups
            dbus
            libdrm
            gtk3
            pango
            cairo
            xorg.libX11
            xorg.libXcomposite
            xorg.libXdamage
            xorg.libXext
            xorg.libXfixes
            xorg.libXrandr
            xorg.libxcb
            mesa
            expat
            alsa-lib
            at-spi2-atk
            at-spi2-core
            libxkbcommon
            xorg.libxshmfence
          ]);
        };
      }
    );
}
