import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import { getLogger } from "./logger.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const caller = path.join(root, "stub/build/dll_call");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveDll(dll: string): string {
  const candidates = [
    path.resolve(root, dll),
    path.resolve(root, "stub", dll),
    path.resolve(root, "stub/dll", path.basename(dll)),
  ];
  return candidates.find((item) => fs.existsSync(item)) ?? candidates[0];
}

export class ThriftClient {
  private readonly log = getLogger();

  constructor(
    private readonly host = "127.0.0.1",
    private readonly port = 9090
  ) {}

  async callDll(dll: string, fn: string, params: Record<string, unknown>): Promise<void> {
    const flat: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      flat[key] = value === undefined || value === null ? "" : String(value);
    }
    const encoded = Object.entries(flat)
      .map(([key, value]) => `${key}=${value.replaceAll(";", ",")}`)
      .join(";");
    const dllPath = resolveDll(dll);

    this.log.info(`call ${dllPath}::${fn} ${JSON.stringify(flat)}`, fn);

    const { stdout, stderr } = await execFileAsync(caller, [dllPath, fn, encoded], {
      cwd: root,
      timeout: 5000,
    });
    for (const line of `${stdout}${stderr}`.split("\n")) {
      const text = line.trim();
      if (text) this.log.info(text, fn);
    }

    const sleepMs = Number(flat.sleep_ms ?? 0);
    await sleep(Number.isFinite(sleepMs) && sleepMs > 0 ? Math.min(sleepMs, 800) : 40);
  }
}
