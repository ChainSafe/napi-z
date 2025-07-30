
export const TARGETS = [
  "aarch64-apple-darwin",
  "aarch64-unknown-linux-gnu",
  "x86_64-apple-darwin",
  "x86_64-unknown-linux-gnu",
  "x86_64-unknown-linux-musl",
  "x86_64-pc-windows-msvc"
] as const;

export type Target = typeof TARGETS[number];

export type Config = {
  binaryName: string;
  targets: Target[];
};

export function parsePkgJson(pkgJson: any): Config {
  const napi = pkgJson.napi;
  if (typeof napi !== "object" || napi === null) {
    throw new Error("napi field is missing in package.json");
  }
  const binaryName = napi.binaryName;
  if (typeof binaryName !== "string") {
    throw new Error("napi.binaryName must be a string");
  }
  const targets = napi.targets;
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error("napi.targets must be a non-empty array");
  }
  for (const target of targets) {
    if (typeof target !== "string") {
      throw new Error("napi.targets must contain only strings");
    }
    if (!TARGETS.includes(target as Target)) {
      throw new Error(`Unsupported target: ${target}`);
    }
  }
  return {
    binaryName,
    targets: targets as Target[]
  };
}

export function getTargetParts(target: Target): {platform: NodeJS.Platform, arch: NodeJS.Architecture, abi?: string} {
  let platform: NodeJS.Platform;
  let arch: NodeJS.Architecture;
  let abi: string | undefined;
  switch (target) {
    case "aarch64-apple-darwin":
      platform = "darwin";
      arch = "arm64";
      break;
    case "aarch64-unknown-linux-gnu":
      platform = "linux";
      arch = "arm64";
      abi = "gnu";
      break;
    case "x86_64-apple-darwin":
      platform = "darwin";
      arch = "x64";
      break;
    case "x86_64-unknown-linux-gnu":
      platform = "linux";
      arch = "x64";
      abi = "gnu";
      break;
    case "x86_64-unknown-linux-musl":
      platform = "linux";
      arch = "x64";
      abi = "musl";
      break;
    case "x86_64-pc-windows-msvc":
      platform = "win32";
      arch = "x64";
      abi = "msvc";
      break;
  }
  return {platform, arch, abi};
}
