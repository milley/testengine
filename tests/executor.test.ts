import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Executor } from "../src/executor.js";
import { NodeManager } from "../src/node_manager.js";
import type { TestNode } from "../src/types.js";

const tree: TestNode[] = [
  { name: "open", type: "node", dll: "./dll/wifi_test.dll", function: "open_dut_port", params: { port: 10 } },
  {
    name: "group",
    type: "folder",
    children: [
      { name: "measure", type: "node", dll: "./dll/wifi_test.dll", function: "measure_evm", params: { rate: "MCS7" } },
    ],
  },
  { name: "close", type: "node", dll: "./dll/wifi_test.dll", function: "close_dut_port" },
];

describe("NodeManager", () => {
  it("registers nested ids and summarizes status", () => {
    const nodes = new NodeManager();
    nodes.register(tree);
    assert.deepEqual(nodes.getAll().map((item) => item.name), ["open", "group", "group/measure", "close"]);
    nodes.setStatus("open", "success");
    nodes.setStatus("group/measure", "failed", "bad evm");
    const summary = nodes.summary();
    assert.equal(summary.total, 4);
    assert.equal(summary.success, 1);
    assert.equal(summary.failed, 1);
    assert.equal(summary.idle, 2);
    assert.equal(nodes.getAll().find((item) => item.name === "group/measure")?.error, "bad evm");
  });
});

describe("Executor", () => {
  it("calls dll functions in order and marks every node success", async () => {
    const calls: string[] = [];
    const executor = new Executor(async (_dll, fn, params) => {
      calls.push(`${fn}:${JSON.stringify(params)}`);
    });
    const result = await executor.run(tree);
    assert.equal(result.status, "success");
    assert.deepEqual(calls, ['open_dut_port:{"port":10}', 'measure_evm:{"rate":"MCS7"}', "close_dut_port:{}"]);
    assert.equal(executor.nodes.summary().success, 4);
  });

  it("marks a node failed when the dll call throws and continues", async () => {
    const executor = new Executor(async (_dll, fn) => {
      if (fn === "measure_evm") throw new Error("instrument timeout");
    });
    const result = await executor.run(tree);
    assert.equal(result.status, "failed");
    const failed = result.nodes.find((node) => node.name === "group/measure");
    assert.equal(failed?.status, "failed");
    assert.match(failed?.error ?? "", /instrument timeout/);
    assert.equal(result.nodes.find((node) => node.name === "close")?.status, "success");
  });

  it("stops remaining nodes after stop is requested", async () => {
    const executor = new Executor(async () => {
      executor.stop();
    });
    const result = await executor.run(tree);
    assert.equal(result.status, "stopped");
    assert.equal(result.nodes.find((node) => node.name === "open")?.status, "stopped");
    assert.equal(result.nodes.find((node) => node.name === "close")?.status, "stopped");
  });

  it("fails a node when structured params are out of range", async () => {
    const executor = new Executor(async () => {
      throw new Error("should not be called");
    });
    const result = await executor.run([
      {
        name: "bad",
        type: "node",
        dll: "./dll/wifi_test.dll",
        function: "open_dut_port",
        params: { port: { type: "int", value: 99, min: 1, max: 16 } },
      },
    ]);
    assert.equal(result.status, "failed");
    assert.match(result.nodes[0].error ?? "", /param validation failed/);
  });
});
