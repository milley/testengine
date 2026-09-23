<template>
  <el-tree-v2
    v-if="data.length"
    :data="data"
    :height="height"
    :props="treeProps"
    :default-expanded-keys="expanded"
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
  <el-empty v-else description="点击「加载」选择 JSON 配置" :image-size="72" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TreeItem } from "../types";

const props = defineProps<{
  data: TreeItem[];
  height: number;
}>();

function collectExpanded(items: TreeItem[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (item.children?.length) {
      ids.push(item.id);
      ids.push(...collectExpanded(item.children));
    }
  }
  return ids;
}

const expanded = computed(() => collectExpanded(props.data));

const emit = defineEmits<{ click: [id: string] }>();

const treeProps = { value: "id", label: "label", children: "children" };

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
