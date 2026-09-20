import type { NodeRuntimeState, RunStatus, TestNode } from "./types.js";

export class NodeManager {
  private states = new Map<string, NodeRuntimeState>();

  register(nodes: TestNode[], prefix = ""): void {
    for (const node of nodes) {
      const id = prefix ? `${prefix}/${node.name}` : node.name;
      this.states.set(id, { name: id, status: "idle" });
      if (node.children) this.register(node.children, id);
    }
  }

  setStatus(id: string, status: RunStatus, error?: string): void {
    const prev = this.states.get(id) ?? { name: id, status: "idle" };
    const now = new Date().toISOString();
    this.states.set(id, {
      ...prev,
      status,
      error,
      startedAt: status === "running" ? now : prev.startedAt,
      finishedAt: status === "running" ? undefined : now,
    });
  }

  getAll(): NodeRuntimeState[] {
    return [...this.states.values()];
  }

  summary(): {
    total: number;
    idle: number;
    running: number;
    success: number;
    failed: number;
    stopped: number;
  } {
    const all = this.getAll();
    return {
      total: all.length,
      idle: all.filter((s) => s.status === "idle").length,
      running: all.filter((s) => s.status === "running").length,
      success: all.filter((s) => s.status === "success").length,
      failed: all.filter((s) => s.status === "failed").length,
      stopped: all.filter((s) => s.status === "stopped").length,
    };
  }
}
