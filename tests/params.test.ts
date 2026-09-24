import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ParamValidator } from "../src/param_validator.js";
import { flattenParams, fromParamMeta, inferType, toParamMeta } from "../src/params.js";

describe("params", () => {
  it("infers scalar types", () => {
    assert.equal(inferType(10), "int");
    assert.equal(inferType(1.5), "float");
    assert.equal(inferType(true), "bool");
    assert.equal(inferType("diag"), "string");
    assert.equal(inferType("18.5"), "float");
  });

  it("flattens structured params to their values", () => {
    const flat = flattenParams({
      port: { type: "int", value: 10, min: 1, max: 64 },
      name: "diag",
    });
    assert.deepEqual(flat, { port: 10, name: "diag" });
  });

  it("round-trips structured metadata", () => {
    const fields = toParamMeta({
      power: { type: "float", value: 18.5, min: 0, max: 30 },
      enabled: true,
    });
    assert.equal(fields[0].type, "float");
    assert.equal(fields[0].min, 0);
    assert.equal(fields[1].type, "bool");
    const restored = fromParamMeta(fields);
    assert.deepEqual(restored.power, { type: "float", value: 18.5, min: 0, max: 30 });
    assert.equal(restored.enabled, true);
  });
});

describe("ParamValidator", () => {
  it("accepts values inside min and max", () => {
    const errors = ParamValidator.validate({
      port: { type: "int", value: 10, min: 1, max: 64 },
      power: { type: "float", value: 18.5, min: 0, max: 30 },
      reset: true,
      desc: "diag",
    });
    assert.deepEqual(errors, []);
  });

  it("rejects values outside bounds and wrong types", () => {
    const errors = ParamValidator.validate({
      port: { type: "int", value: 99, min: 1, max: 64 },
      ratio: { type: "float", value: "bad" },
      flag: { type: "bool", value: "maybe" },
    });
    assert.equal(errors.length, 3);
    assert.match(errors[0], /99 > max 64/);
    assert.match(errors[1], /expected float/);
    assert.match(errors[2], /expected bool/);
  });
});
