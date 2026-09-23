import { EventEmitter } from "node:events";
import * as path from "node:path";
import { ConfigParser } from "./config_parser.js";
import { Executor } from "./executor.js";
import { getLogger } from "./logger.js";
import { ThriftClient } from "./thrift_client.js";
import type { NodeRuntimeState, RunStatus, TestNode } from "./types.js";

export class Engine extends EventEmitter {
  tree: TestNode[] = [];
  jsonPath: string;
  running = false;
  lastStatus: RunStatus = "idle";
  private executor?: Executor;
  private readonly client: ThriftClient;
  private readonly log = getLogger();

  constructor(
    jsonPath = path.resolve(process.cwd(), process.env.TREE_FILE ?? "demo.json"),
    host = "127.0.0.1",
    port = 9090
  ) {
    super();
    this.jsonPath = jsonPath;
    this.client = new ThriftClient(host, port);
    this.load();
  }

  load(jsonPath = this.jsonPath): TestNode[] {
    this.jsonPath = jsonPath;
    this.tree = ConfigParser.load(jsonPath);
    this.log.info(`loaded tree from ${jsonPath}`);
    this.emit("tree", this.tree);
    return this.tree;
  }

  save(nodes: TestNode[] = this.tree, jsonPath = this.jsonPath): void {
    this.tree = nodes;
    ConfigParser.save(jsonPath, nodes);
    this.log.info(`saved tree to ${jsonPath}`);
  }

  stop(): void {
    this.executor?.stop();
  }

  snapshot(): {
    running: boolean;
    status: RunStatus;
    summary: ReturnType<Executor["nodes"]["summary"]> | null;
    nodes: NodeRuntimeState[];
    logFiles: { jsonl: string; text: string };
  } {
    return {
      running: this.running,
      status: this.lastStatus,
      summary: this.executor?.nodes.summary() ?? null,
      nodes: this.executor?.nodes.getAll() ?? [],
      logFiles: { jsonl: this.log.jsonlFile, text: this.log.textFile },
    };
  }

  async run(): Promise<void> {
    if (this.running) throw new Error("tree is already running");
    this.running = true;
    this.lastStatus = "running";
    const expanded = ConfigParser.expandLoops(this.tree);
    this.executor = new Executor((dll, fn, params) => this.client.callDll(dll, fn, params));
    this.executor.on("status", (payload) => this.emit("status", payload));
    this.log.info("run started");
    try {
      const result = await this.executor.run(expanded);
      this.lastStatus = result.status;
      this.log.info(`run finished: ${result.status}`);
      this.emit("done", result);
    } finally {
      this.running = false;
    }
  }
}

let shared: Engine | undefined;

export function getEngine(): Engine {
  if (!shared) shared = new Engine();
  return shared;
}
