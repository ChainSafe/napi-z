import { promises as fs } from "node:fs";
import { parseArgs, ParseArgsOptionsConfig } from "node:util";
import { Config, getTargetParts, parsePkgJson } from "./config.js";

export async function moveArtifacts(pkgJson: any, config: Config, opts: PrepublishOpts): Promise<void> {
  for (const target of config.targets) {
    const artifactPath = `${opts.artifactsDir}/${target}/${config.binaryName}.node`;
    const destPath = `${opts.npmDir}/${pkgJson.name}-${target}/${config.binaryName}.node`;

    await fs.rename(artifactPath, destPath).catch((err) => {
      if (err.code === 'ENOENT') {
        console.warn(`Artifact not found: ${artifactPath}`);
        return;
      }
      throw err;
    });
  }
}

export async function updateTargetPkgJsons(
  pkgJson: any,
  config: Config,
  opts: PrepublishOpts
): Promise<void> {
  for (const target of config.targets) {
    const {platform, arch, abi} = getTargetParts(target);

    const libc = platform !== 'linux' ?
      undefined :
      abi === 'gnu' ? 'glibc' :
      abi === 'musl' ? 'musl' :
      undefined;

    const targetPkgJson = {
      name: `${pkgJson.name}-${target}`,
      version: pkgJson.version,
      license: pkgJson.license,
      repository: pkgJson.repository,
      main: `${config.binaryName}.node`,
      files: [`${config.binaryName}.node`],
      os: [platform],
      cpu: [arch],
      ...(libc ? { libc: [libc] } : {}),
    };
    await fs.writeFile(`${opts.npmDir}/${target}/package.json`, JSON.stringify(targetPkgJson, null, 2));
    await fs.writeFile(`${opts.npmDir}/${target}/README.md`, `# \`${targetPkgJson.name}\`\n
This is the ${target} target package for ${pkgJson.name}.

`);
  }
}

export function updateOptionalDependencies(
  pkgJson: any,
  config: Config,
): any {
  const optionalDependencies: Record<string, string> = {};
  for (const target of config.targets) {
    optionalDependencies[`${pkgJson.name}-${target}`] = pkgJson.version;
  }
  pkgJson.optionalDependencies = optionalDependencies;
  return pkgJson;
}


type PrepublishOpts = {
  artifactsDir: string;
  npmDir: string;
};

const prepublishOptions = {
    artifactsDir: {
      type: "string",
      default: "artifacts",
    },
    npmDir: {
      type: "string",
      default: "npm",
    }
} satisfies ParseArgsOptionsConfig;

export async function prepublishCli(): Promise<void> {
  const {values} = parseArgs({
    options: prepublishOptions,
    allowPositionals: true,
  });

  const pkgJson = JSON.parse(await fs.readFile("package.json", "utf-8"));
  const config = parsePkgJson(pkgJson);

  await moveArtifacts(pkgJson, config, values);
  await updateTargetPkgJsons(pkgJson, config, values);

  const updatedPkgJson = await updateOptionalDependencies(pkgJson, config);
  await fs.writeFile("package.json", JSON.stringify(updatedPkgJson, null, 2));
}
