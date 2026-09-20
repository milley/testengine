import * as fs from "node:fs";
import { z } from "zod";
import type { TestNode, TestSequenceFile } from "./types.js";

const TestNodeSchema: z.ZodType<TestNode> = z.lazy(() =>
  z.object({
    name: z.string().min(1),
    type: z.enum(["node", "folder"]),
    dll: z.string().optional(),
    function: z.string().optional(),
    params: z.record(z.unknown()).optional(),
    loop_type: z.enum(["loop", "none"]).optional(),
    children: z.array(TestNodeSchema).optional(),
  })
);

const FileSchema = z.object({
  test_sqeuence: z.array(TestNodeSchema).optional(),
  test_sequence: z.array(TestNodeSchema).optional(),
});

export class ConfigParser {
  static load(jsonPath: string): TestNode[] {
    const content = fs.readFileSync(jsonPath, "utf8");
    const raw = JSON.parse(content) as TestSequenceFile;
    const parsed = FileSchema.parse(raw);
    const sequence = parsed.test_sequence ?? parsed.test_sqeuence;
    if (!sequence || sequence.length === 0) {
      throw new Error(`No test_sequence found in ${jsonPath}`);
    }
    return sequence;
  }

  static save(jsonPath: string, nodes: TestNode[]): void {
    const payload: TestSequenceFile = { test_sequence: nodes };
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 4) + "\n", "utf8");
  }

  /** Expand folder loop_type=loop: each comma-separated param value clones children. */
  static expandLoops(nodes: TestNode[]): TestNode[] {
    const result: TestNode[] = [];
    for (const node of nodes) {
      if (node.type === "folder" && node.loop_type === "loop" && node.params) {
        result.push(...this.expandFolder(node));
      } else if (node.children) {
        result.push({ ...node, children: this.expandLoops(node.children) });
      } else {
        result.push(node);
      }
    }
    return result;
  }

  private static expandFolder(folder: TestNode): TestNode[] {
    const entries = Object.entries(folder.params ?? {});
    if (entries.length === 0) {
      return [{ ...folder, children: this.expandLoops(folder.children ?? []) }];
    }

    const [key, raw] = entries[0];
    const values = String(raw)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    return values.map((value) => ({
      ...folder,
      name: `${folder.name}[${key}=${value}]`,
      params: { ...folder.params, [key]: value },
      loop_type: "none",
      children: this.expandLoops(folder.children ?? []).map((child) => ({
        ...child,
        params: { ...child.params, [key]: value },
      })),
    }));
  }
}
