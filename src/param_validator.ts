import { toParamMeta } from "./params.js";

export class ParamValidator {
  static validate(params?: Record<string, unknown>): string[] {
    const errors: string[] = [];
    for (const field of toParamMeta(params)) {
      const raw = field.value;
      switch (field.type) {
        case "int": {
          const n = Number(raw);
          if (!Number.isInteger(n)) {
            errors.push(`${field.name}: expected integer, got ${raw}`);
            break;
          }
          if (field.min !== undefined && n < field.min) errors.push(`${field.name}: ${n} < min ${field.min}`);
          if (field.max !== undefined && n > field.max) errors.push(`${field.name}: ${n} > max ${field.max}`);
          break;
        }
        case "float": {
          const n = Number(raw);
          if (Number.isNaN(n)) {
            errors.push(`${field.name}: expected float, got ${raw}`);
            break;
          }
          if (field.min !== undefined && n < field.min) errors.push(`${field.name}: ${n} < min ${field.min}`);
          if (field.max !== undefined && n > field.max) errors.push(`${field.name}: ${n} > max ${field.max}`);
          break;
        }
        case "bool": {
          if (typeof raw !== "boolean" && raw !== "true" && raw !== "false" && raw !== 0 && raw !== 1) {
            errors.push(`${field.name}: expected bool, got ${raw}`);
          }
          break;
        }
        case "string": {
          if (raw === undefined || raw === null) errors.push(`${field.name}: expected string`);
          break;
        }
      }
    }
    return errors;
  }
}
