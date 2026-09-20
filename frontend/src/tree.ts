import type { NodeRuntimeState, RunStatus, TestNode, TreeItem } from "./types";

function statusOf(path: string, name: string, states: NodeRuntimeState[]): RunStatus {
  const exact = states.find((s) => s.name === path || s.name === name);
  if (exact) return exact.status;
  const related = states.filter((s) => s.name.startsWith(path) || s.name.startsWith(name));
  if (related.some((s) => s.status === "running")) return "running";
  if (related.some((s) => s.status === "failed")) return "failed";
  if (related.some((s) => s.status === "stopped")) return "stopped";
  if (related.length && related.every((s) => s.status === "success")) return "success";
  return "idle";
}

export function toTreeItems(nodes: TestNode[], states: NodeRuntimeState[] = [], prefix = "", namePrefix = ""): TreeItem[] {
  return nodes.map((node, index) => {
    const id = prefix ? `${prefix}-${index}` : String(index);
    const path = namePrefix ? `${namePrefix}/${node.name}` : node.name;
    const item: TreeItem = {
      id,
      label: node.name,
      path,
      type: node.type,
      status: statusOf(path, node.name, states),
    };
    if (node.children?.length) {
      item.children = toTreeItems(node.children, states, id, path);
    }
    return item;
  });
}

export function findNode(nodes: TestNode[], id: string, prefix = ""): TestNode | undefined {
  for (let index = 0; index < nodes.length; index += 1) {
    const current = prefix ? `${prefix}-${index}` : String(index);
    if (current === id) return nodes[index];
    if (nodes[index].children) {
      const found = findNode(nodes[index].children!, id, current);
      if (found) return found;
    }
  }
  return undefined;
}

export function isStructured(value: unknown): value is { value: unknown; type?: string; min?: number; max?: number } {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && "value" in (value as object);
}

export function inferType(value: unknown): "int" | "float" | "bool" | "string" {
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
  return "string";
}
