<template>
  <el-tree-v2
    :data="data"
    :height="height"
    :props="props"
    highlight-current
    expand-on-click-node
    @node-click="onClick"
  >
    <template #default="{ node }">
      <div class="row">
        <el-icon v-if="node.data.type === 'folder'"><Folder /></el-icon>
        <el-icon v-else><Cpu /></el-icon>
        <span class="name">{{ node.data.label }}</span>
        <el-tag size="small" :type="tagType(node.data.status)" effect="plain">
          {{ node.data.status }}
        </el-tag>
      </div>
    </template>
  </el-tree-v2>
</template>

<script setup lang="ts">
import type { TreeItem } from "../types";

defineProps<{
  data: TreeItem[];
  height: number;
}>();

const emit = defineEmits<{ click: [id: string] }>();

const props = { value: "id", label: "label", children: "children" };

function onClick(node: TreeItem) {
  emit("click", node.id);
}

function tagType(status: string) {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  if (status === "running") return "primary";
  if (status === "stopped") return "warning";
  return "info";
}
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding-right: 8px;
}
.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
