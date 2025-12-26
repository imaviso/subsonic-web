{
  description = "Subsonic client - A web-based music player for Subsonic/OpenSubsonic API servers";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    fenix = {
      url = "github:nix-community/fenix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {self, ...} @ inputs: let
    supportedSystems = [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];
    forEachSupportedSystem = f:
      inputs.nixpkgs.lib.genAttrs supportedSystems (
        system:
          f {
            pkgs = import inputs.nixpkgs {
              inherit system;
              overlays = [
                inputs.self.overlays.default
              ];
            };
          }
      );
  in {
    overlays.default = final: prev: {
      rustToolchain = with inputs.fenix.packages.${prev.stdenv.hostPlatform.system};
        combine (
          with stable; [
            clippy
            rustc
            cargo
            rustfmt
            rust-src
          ]
        );
    };

    devShells = forEachSupportedSystem (
      {pkgs}: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            rustToolchain
            openssl
            glib
            pango
            atk
            gdk-pixbuf
            gtk3
            libsoup_3
            webkitgtk_4_1
            pkg-config
            cargo-deny
            cargo-edit
            cargo-watch
            rust-analyzer
            # Tauri bundling dependencies
            dpkg
            rpm
            libappindicator-gtk3
            librsvg
          ];

          env = {
            # Required by rust-analyzer
            RUST_SRC_PATH = "${pkgs.rustToolchain}/lib/rustlib/src/rust/library";
          };

          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
            pkgs.glib
            pkgs.gtk3
            pkgs.cairo
            pkgs.pango
            pkgs.gdk-pixbuf
            pkgs.libsoup_3
            pkgs.webkitgtk_4_1
            pkgs.openssl
          ];
        };
      }
    );
  };
}
