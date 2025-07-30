import { parseArgs } from "node:util";
import { createNpmDirsCli } from "./create-npm-dirs.js";
import { prepublishCli } from "./prepublish.js";
import { publish } from "./publish.js";

export async function cli(): Promise<void> {
  const {positionals} = parseArgs({
    allowPositionals: true,
    strict: false,
  });

  const cmd = positionals[0];

  switch (cmd) {
    case "create-npm-dirs":
      return await createNpmDirsCli();
    case "prepublish":
      return await prepublishCli();
    case "publish":
      return await publish();
    default:
      throw new Error(`Unknown command "${cmd}"`);
  }
}

await cli();