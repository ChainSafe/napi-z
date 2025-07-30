import { promises as fs } from "node:fs";
import { join } from "node:path";
import { parsePkgJson } from "./config.js";
import { spawnSync } from "node:child_process";

function extraPublishArgs(): string[] {
  const publishIx = process.argv.findIndex((arg) => arg === "publish");
  if (process.argv[publishIx + 1] === "--") {
    return process.argv.slice(publishIx + 2);
  }
  return process.argv.slice(publishIx + 1);
}

export async function publish(): Promise<void> {
  const publishArgv = ["publish", ...extraPublishArgs()];

  const pkgJson = JSON.parse(await fs.readFile("package.json", "utf-8"));
  const config = parsePkgJson(pkgJson);
  for (const target of config.targets) {
    spawnSync("npm", publishArgv, {
      cwd: join(process.cwd(), "npm", target),
      env: process.env
    });
  }
  spawnSync("npm", publishArgv, {
    cwd: process.cwd(),
    env: process.env
  });
}