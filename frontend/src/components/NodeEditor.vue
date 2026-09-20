<template>
  <div v-if="node" class="editor">
    <el-form label-position="top">
      <el-form-item label="名称">
        <el-input v-model="node.name" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="node.type">
          <el-option label="执行节点" value="node" />
          <el-option label="文件夹" value="folder" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="node.type === 'folder'" label="循环">
        <el-select v-model="node.loop_type">
          <el-option label="无" value="none" />
          <el-option label="loop 展开 params" value="loop" />
        </el-select>
      </el-form-item>
      <el-form-item label="动态库">
        <el-input v-model="node.dll" placeholder="./dll/wifi_test.dll" />
      </el-form-item>
      <el-form-item label="导出函数">
        <el-input v-model="node.function" />
      </el-form-item>
    </el-form>

    <div class="params-head">
      <span>参数</span>
      <el-button size="small" type="primary" plain @click="addParam">添加</el-button>
    </div>

    <el-table :data="fields" size="small" class="param-table">
      <el-table-column label="名称" min-width="110">
        <template #default="{ row }">
          <el-input v-model="row.name" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="类型" width="110">
        <template #default="{ row }">
          <el-select v-model="row.type" size="small">
            <el-option label="int" value="int" />
            <el-option label="float" value="float" />
            <el-option label="bool" value="bool" />
            <el-option label="string" value="string" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="值" min-width="120">
        <template #default="{ row }">
          <el-switch v-if="row.type === 'bool'" v-model="row.value" />
          <el-input-number
            v-else-if="row.type === 'int' || row.type === 'float'"
            v-model="row.value"
            :step="row.type === 'int' ? 1 : 0.1"
            size="small"
            controls-position="right"
          />
          <el-input v-else v-model="row.value" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="下限" width="110">
        <template #default="{ row }">
          <el-input-number
            v-if="row.type === 'int' || row.type === 'float'"
            v-model="row.min"
            size="small"
            controls-position="right"
          />
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="上限" width="110">
        <template #default="{ row }">
          <el-input-number
            v-if="row.type === 'int' || row.type === 'float'"
            v-model="row.max"
            size="small"
            controls-position="right"
          />
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column width="60">
        <template #default="{ $index }">
          <el-button type="danger" link size="small" @click="fields.splice($index, 1)">删</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-alert v-if="errors.length" type="error" :closable="false" class="errors">
      <div v-for="err in errors" :key="err">{{ err }}</div>
    </el-alert>
  </div>
  <el-empty v-else description="选择左侧节点以编辑属性" />
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import type { ParamMeta, TestNode } from "../types";
import { inferType, isStructured } from "../tree";

const props = defineProps<{ node?: TestNode }>();

const fields = defineModel<ParamMeta[]>("fields", { default: () => [] });

watch(
  () => props.node,
  (node) => {
    fields.value = Object.entries(node?.params ?? {}).map(([name, raw]) => {
      if (isStructured(raw)) {
        return {
          name,
          type: (raw.type as ParamMeta["type"]) ?? inferType(raw.value),
          value: raw.value as string | number | boolean,
          min: raw.min,
          max: raw.max,
        };
      }
      return { name, type: inferType(raw), value: raw as string | number | boolean };
    });
  },
  { immediate: true }
);

watch(
  fields,
  (list) => {
    if (!props.node) return;
    const params: Record<string, unknown> = {};
    for (const field of list) {
      if (field.min !== undefined || field.max !== undefined) {
        params[field.name] = {
          type: field.type,
          value: field.value,
          ...(field.min !== undefined ? { min: field.min } : {}),
          ...(field.max !== undefined ? { max: field.max } : {}),
        };
      } else {
        params[field.name] = field.value;
      }
    }
    props.node.params = params;
  },
  { deep: true }
);

const errors = computed(() => {
  const msgs: string[] = [];
  for (const field of fields.value) {
    if (!field.name) msgs.push("参数名不能为空");
    if (field.type === "int" || field.type === "float") {
      const n = Number(field.value);
      if (Number.isNaN(n)) msgs.push(`${field.name}: 数值无效`);
      if (field.min !== undefined && n < field.min) msgs.push(`${field.name}: ${n} 低于下限 ${field.min}`);
      if (field.max !== undefined && n > field.max) msgs.push(`${field.name}: ${n} 高于上限 ${field.max}`);
    }
  }
  return msgs;
});

function addParam() {
  fields.value.push({ name: `param_${fields.value.length + 1}`, type: "string", value: "" });
}

defineExpose({ errors });
</script>

<style scoped>
.editor { padding: 4px 8px 16px; }
.params-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0 8px;
}
.param-table { width: 100%; }
.muted { color: var(--muted); }
.errors { margin-top: 12px; }
</style>
