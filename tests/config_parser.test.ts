import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, it } from "node:test";
import { ConfigParser } from "../src/config_parser.js";
import type { TestNode } from "../src/types.js";

function writeTemp(file: string, data: unknown): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "testengine-"));
  const full = path.join(dir, file);
  fs.writeFileSync(full, JSON.stringify(data));
  return full;
}

describe("ConfigParser.load", () => {
  it("loads test_sequence array", () => {
    const file = writeTemp("seq.json", {
      test_sequence: [{ name: "a", type: "node" }],
    });
    const nodes = ConfigParser.load(file);
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].name, "a");
  });

  it("accepts legacy test_sqeuence key", () => {
    const file = writeTemp("legacy.json", {
      test_sqeuence: [{ name: "b", type: "folder", children: [] }],
    });
    const nodes = ConfigParser.load(file);
    assert.equal(nodes[0].name, "b");
  });

  it("throws when sequence is missing or empty", () => {
    const file = writeTemp("empty.json", { test_sequence: [] });
    assert.throws(() => ConfigParser.load(file), /No test_sequence/);
  });

  it("rejects an unknown node type", () => {
    const file = writeTemp("bad.json", {
      test_sequence: [{ name: "x", type: "task" }],
    });
    assert.throws(() => ConfigParser.load(file));
  });
});

describe("ConfigParser.save", () => {
  it("writes test_sequence with indentation", () => {
    const nodes: TestNode[] = [{ name: "n1", type: "node", params: { a: 1 } }];
    const file = writeTemp("save.json", {});
    ConfigParser.save(file, nodes);
    const raw = fs.readFileSync(file, "utf8");
    assert.match(raw, /"test_sequence"/);
    assert.match(raw, /\n {4}/);
    const loaded = ConfigParser.load(file);
    assert.deepEqual(loaded[0].params, { a: 1 });
  });
});

describe("ConfigParser.expandLoops", () => {
  it("expands folder loop values and injects the value into children", () => {
    const tree: TestNode[] = [
      {
        name: "folder",
        type: "folder",
        loop_type: "loop",
        params: { channel: "1,6" },
        children: [{ name: "step", type: "node", params: { rate: "MCS7" } }],
      },
    ];
    const out = ConfigParser.expandLoops(tree);
    assert.equal(out.length, 2);
    assert.equal(out[0].name, "folder[channel=1]");
    assert.equal(out[0].loop_type, "none");
    assert.equal(out[0].children?.[0].params?.channel, "1");
    assert.equal(out[0].children?.[0].params?.rate, "MCS7");
    assert.equal(out[1].name, "folder[channel=6]");
    assert.equal(out[1].children?.[0].params?.channel, "6");
  });

  it("keeps non-loop folders intact", () => {
    const tree: TestNode[] = [
      { name: "group", type: "folder", children: [{ name: "s", type: "node" }] },
    ];
    const out = ConfigParser.expandLoops(tree);
    assert.equal(out.length, 1);
    assert.equal(out[0].name, "group");
    assert.equal(out[0].children?.[0].name, "s");
  });
});
