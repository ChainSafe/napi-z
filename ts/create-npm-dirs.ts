import { promises as fs } from "node:fs";
import { Config, parsePkgJson } from "./config.js";
import { parseArgs, ParseArgsOptionsConfig } from "node:util";

export type CreateNpmDirsOpts = {
  npmDir: string;
};

export async function createNpmDirs(config: Config, opts: CreateNpmDirsOpts): Promise<void> {
  for (const target of config.targets) {
    await fs.mkdir(`${opts.npmDir}/${target}`, { recursive: true });
  }
}

export type UpdateTargetPkgJsonOpts = {
  npmDir: string;
};

const createNpmDirsOptions = {
  npmDir: {
    type: "string",
    default: "npm",
  }
} satisfies ParseArgsOptionsConfig;

export async function createNpmDirsCli(): Promise<void> {
  const {values} = parseArgs({
    options: createNpmDirsOptions,
    allowPositionals: true,
  });

  const pkgJson = JSON.parse(await fs.readFile("package.json", "utf-8"));
  const config = parsePkgJson(pkgJson);

  await createNpmDirs(config, values);
  // await updateTargetPkgJsons(pkgJson, config, { npmDir });
  // const updatedPkgJson = updateOptionalDependencies(pkgJson, config);
  // await fs.writeFile("package.json", JSON.stringify(updatedPkgJson, null, 2));
}