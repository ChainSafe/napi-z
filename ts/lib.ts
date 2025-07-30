import { existsSync, readFileSync } from "node:fs";
import { parsePkgJson, Target } from "./config.js";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// from napi-rs
const isMusl = () => {
  let musl: boolean | null = false
  if (process.platform === 'linux') {
    musl = isMuslFromFilesystem()
    if (musl === null) {
      musl = isMuslFromReport()
    }
    if (musl === null) {
      musl = isMuslFromChildProcess()
    }
  }
  return musl
}

const isFileMusl = (f: string) => f.includes('libc.musl-') || f.includes('ld-musl-')

const isMuslFromFilesystem = () => {
  try {
    return readFileSync('/usr/bin/ldd', 'utf-8').includes('musl')
  } catch {
    return null
  }
}

const isMuslFromReport = () => {
  let report = null
  if (typeof process.report?.getReport === 'function') {
    (process.report as any).excludeNetwork = true
    report = process.report.getReport()
  }
  if (!report) {
    return null
  }
  if ((report as any).header && (report as any).header.glibcVersionRuntime) {
    return false
  }
  if (Array.isArray((report as any).sharedObjects)) {
    if ((report as any).sharedObjects.some(isFileMusl)) {
      return true
    }
  }
  return false
}

const isMuslFromChildProcess = () => {
  try {
    return require('child_process').execSync('ldd --version', { encoding: 'utf8' }).includes('musl')
  } catch (e) {
    // If we reach this case, we don't know if the system is musl or not, so is better to just fallback to false
    return false
  }
}

function getTarget(platform: NodeJS.Platform, arch: NodeJS.Architecture): Target {
  if (platform === "darwin") {
    if (arch === "arm64") {
      return "aarch64-apple-darwin";
    }
    if (arch === "x64") {
      return "x86_64-apple-darwin";
    }
  } else if (platform === "linux") {
    const abi = isMusl() ? "musl" : "gnu";
    if (arch === "arm64" && abi === "gnu") {
      return `aarch64-unknown-linux-${abi}`;
    }
    if (arch === "x64") {
      return `x86_64-unknown-linux-${abi}`;
    }
  } else if (platform === "win32") {
    if (arch === "x64") {
      return "x86_64-pc-windows-msvc";
    }
  }
  throw new Error(`Unsupported platform: ${platform} or architecture: ${arch}`);
}

/**
 * This function searches all feasible library paths and attempts to load the library.
 *
 * Depending on whether the library has been built locally or published, the library may be in different locations.
 *
 * First, it checks the local build path, then it checks published paths.
 *
 * Eg:
 * - built locally, `zig-out/lib/${binaryName}.node`
 * - published, `${targetPackageName}`
 */
export function requireNapiLibrary(packageDir: string): any {
  const pkgJson = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf-8"));
  const config = parsePkgJson(pkgJson);
  const localPath = join(packageDir, `zig-out/lib/${config.binaryName}.node`);
  if (existsSync(localPath)) {
    return require(localPath);
  } else {
    const platform = process.platform;
    const arch = process.arch;
    const target = getTarget(platform, arch);
    const targetPkgName = `${pkgJson.name}-${target}`;
    return require(targetPkgName);
  }
}