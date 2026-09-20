import { EventEmitter } from "node:events";
import { getLogger } from "./logger.js";
import { NodeManager } from "./node_manager.js";
import { flattenParams } from "./params.js";
import { ParamValidator } from "./param_validator.js";
import type { RunResult, TestNode } from "./types.js";

export interface CallDllFn {
  (dll: string, fn: string, params: Record<string, unknown>): Promise<void>;
}

export class Executor extends EventEmitter {
  private stopped = false;
  private readonly log = getLogger();
  readonly nodes = new NodeManager();

  constructor(private readonly callDll: CallDllFn) {
    super();
  }

  stop(): void {
    this.stopped = true;
    this.log.warn("stop requested");
  }

  async run(tree: TestNode[]): Promise<RunResult> {
    this.stopped = false;
    this.nodes.register(tree);
    const logs: string[] = [];

    try {
      await this.runList(tree, "", logs);
      const failed = this.nodes.getAll().some((n) => n.status === "failed");
      const stopped = this.nodes.getAll().some((n) => n.status === "stopped");
      return {
        status: stopped ? "stopped" : failed ? "failed" : "success",
        logs,
        nodes: this.nodes.getAll(),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error(message);
      return { status: "failed", error: message, logs, nodes: this.nodes.getAll() };
    }
  }

  private emitStatus(id: string): void {
    this.emit("status", { id, nodes: this.nodes.getAll(), summary: this.nodes.summary() });
  }

  private async runList(nodes: TestNode[], prefix: string, logs: string[]): Promise<void> {
    for (const node of nodes) {
      if (this.stopped) {
        this.markRemaining(nodes, prefix, node);
        return;
      }
      await this.runOne(node, prefix, logs);
    }
  }

  private async runOne(node: TestNode, prefix: string, logs: string[]): Promise<void> {
    const id = prefix ? `${prefix}/${node.name}` : node.name;
    this.nodes.setStatus(id, "running");
    this.emitStatus(id);
    this.log.info(`running ${id}`, id);
    logs.push(`[INFO] running ${id}`);

    try {
      const errors = ParamValidator.validate(node.params);
      if (errors.length) {
        throw new Error(`param validation failed: ${errors.join("; ")}`);
      }
      if (node.dll && node.function) {
        await this.callDll(node.dll, node.function, flattenParams(node.params));
      }
      if (node.children?.length) {
        await this.runList(node.children, id, logs);
      }
      if (this.stopped) {
        this.nodes.setStatus(id, "stopped");
        this.emitStatus(id);
        return;
      }
      this.nodes.setStatus(id, "success");
      this.emitStatus(id);
      this.log.info(`success ${id}`, id);
      logs.push(`[INFO] success ${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.nodes.setStatus(id, "failed", message);
      this.emitStatus(id);
      this.log.error(`${id}: ${message}`, id);
      logs.push(`[ERROR] ${id}: ${message}`);
    }
  }

  private markRemaining(nodes: TestNode[], prefix: string, from: TestNode): void {
    let seen = false;
    for (const node of nodes) {
      if (node === from) seen = true;
      if (!seen) continue;
      const id = prefix ? `${prefix}/${node.name}` : node.name;
      this.nodes.setStatus(id, "stopped");
      this.emitStatus(id);
    }
  }
}
