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
  min?: number;
  max?: number;
}

export interface LogEntry {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  node?: string;
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

export interface TestSequenceFile {
  test_sqeuence?: TestNode[];
  test_sequence?: TestNode[];
}

export interface NodeRuntimeState {
  name: string;
  status: RunStatus;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface RunResult {
  status: RunStatus;
  error?: string;
  logs: string[];
  nodes: NodeRuntimeState[];
}
