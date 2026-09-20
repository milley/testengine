import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as path from "node:path";
import type { LogEntry } from "./types.js";

const MAX_MEMORY = 2000;

function stamp(): string {
  return new Date().toISOString();
}

function textLine(entry: LogEntry): string {
  const node = entry.node ? ` [${entry.node}]` : "";
  return `${entry.timestamp} ${entry.level.toUpperCase().padEnd(5)} ${entry.message}${node}`;
}

export class EngineLogger extends EventEmitter {
  readonly logDir: string;
  readonly jsonlFile: string;
  readonly textFile: string;
  private readonly buffer: LogEntry[] = [];

  constructor(logDir = path.resolve(process.cwd(), "logs")) {
    super();
    this.logDir = logDir;
    fs.mkdirSync(logDir, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    this.jsonlFile = path.join(logDir, `testengine-${day}.jsonl`);
    this.textFile = path.join(logDir, `testengine-${day}.log`);
  }

  write(level: LogEntry["level"], message: string, node?: string): LogEntry {
    const entry: LogEntry = { timestamp: stamp(), level, message, node };
    this.buffer.push(entry);
    if (this.buffer.length > MAX_MEMORY) this.buffer.shift();
    fs.appendFileSync(this.jsonlFile, JSON.stringify(entry) + "\n", "utf8");
    fs.appendFileSync(this.textFile, textLine(entry) + "\n", "utf8");
    this.emit("log", entry);
    return entry;
  }

  info(message: string, node?: string): void {
    this.write("info", message, node);
  }

  warn(message: string, node?: string): void {
    this.write("warn", message, node);
  }

  error(message: string, node?: string): void {
    this.write("error", message, node);
  }

  recent(limit = 500): LogEntry[] {
    return this.buffer.slice(-limit);
  }
}

let shared: EngineLogger | undefined;

export function getLogger(): EngineLogger {
  if (!shared) shared = new EngineLogger();
  return shared;
}

export function createLogger(logDir?: string): EngineLogger {
  shared = new EngineLogger(logDir);
  return shared;
}
