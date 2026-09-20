<template>
  <div class="log-panel">
    <div class="log-head">
      <span>日志</span>
      <span class="file">{{ files.text }}</span>
    </div>
    <div ref="box" class="log-body">
      <div v-for="(entry, i) in entries" :key="i" :class="['line', `log-${entry.level}`]">
        {{ entry.timestamp }} {{ entry.level.toUpperCase() }} {{ entry.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import type { LogEntry } from "../types";

const props = defineProps<{
  entries: LogEntry[];
  files: { jsonl: string; text: string };
}>();

const box = ref<HTMLElement>();

watch(
  () => props.entries.length,
  async () => {
    await nextTick();
    if (box.value) box.value.scrollTop = box.value.scrollHeight;
  }
);
</script>

<style scoped>
.log-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0b0f14;
  border-top: 1px solid var(--line);
}
.log-head {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  color: var(--muted);
  font-size: 12px;
}
.file { opacity: 0.7; }
.log-body {
  flex: 1;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.55;
  padding: 0 12px 12px;
}
.line { white-space: pre-wrap; }
</style>
