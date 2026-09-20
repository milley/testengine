export type NodeType = "node" | "folder";
export type LoopType = "loop" | "none";
export type RunStatus = "idle" | "running" | "success" | "failed" | "stopped";
export type ParamType = "int" | "float" | "bool" | "string";

export interface StructuredParam {
  type?: ParamType;
  value: string | number | boolean;
  min?: number;
  max?: number;
}

export interface ParamMeta {
  name: string;
  type: ParamType;
  value: string | number | boolean;
  min?: number | undefined;
  max?: number | undefined;
}

export interface TestNode {
  name: string;
  type: NodeType;
  dll?: string;
  function?: string;
  params?: Record<string, unknown>;
  loop_type?: LoopType;
  children?: TestNode[];
}

export interface LogEntry {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  node?: string;
}

export interface NodeRuntimeState {
  name: string;
  status: RunStatus;
  error?: string;
}

export interface StatusSnapshot {
  running: boolean;
  status: RunStatus;
  summary: {
    total: number;
    idle: number;
    running: number;
    success: number;
    failed: number;
    stopped: number;
  } | null;
  nodes: NodeRuntimeState[];
  logFiles: { jsonl: string; text: string };
}

export interface TreeItem {
  id: string;
  label: string;
  path: string;
  type: NodeType;
  status: RunStatus;
  children?: TreeItem[];
}
