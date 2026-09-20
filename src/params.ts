import type { ParamMeta, ParamType, StructuredParam } from "./types.js";

export function isStructuredParam(value: unknown): value is StructuredParam {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && "value" in (value as object);
}

export function inferType(value: unknown): ParamType {
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
  if (typeof value === "string") {
    if (value === "true" || value === "false") return "bool";
    if (value.trim() !== "" && !Number.isNaN(Number(value))) {
      return value.includes(".") ? "float" : "int";
    }
  }
  return "string";
}

export function flattenParams(params?: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(params ?? {})) {
    out[key] = isStructuredParam(raw) ? raw.value : raw;
  }
  return out;
}

export function toParamMeta(params?: Record<string, unknown>): ParamMeta[] {
  return Object.entries(params ?? {}).map(([name, raw]) => {
    if (isStructuredParam(raw)) {
      return {
        name,
        type: raw.type ?? inferType(raw.value),
        value: raw.value,
        min: raw.min,
        max: raw.max,
      };
    }
    return { name, type: inferType(raw), value: raw as string | number | boolean };
  });
}

export function fromParamMeta(fields: ParamMeta[]): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.min !== undefined || field.max !== undefined) {
      params[field.name] = {
        type: field.type,
        value: coerceValue(field.type, field.value),
        ...(field.min !== undefined ? { min: field.min } : {}),
        ...(field.max !== undefined ? { max: field.max } : {}),
      };
    } else {
      params[field.name] = coerceValue(field.type, field.value);
    }
  }
  return params;
}

export function coerceValue(type: ParamType, value: unknown): string | number | boolean {
  switch (type) {
    case "int":
      return Number.parseInt(String(value), 10) || 0;
    case "float":
      return Number.parseFloat(String(value)) || 0;
    case "bool":
      return value === true || value === "true" || value === 1 || value === "1";
    default:
      return value === undefined || value === null ? "" : String(value);
  }
}
