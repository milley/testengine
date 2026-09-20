<template>
  <div class="shell">
    <header class="top">
      <div class="brand">Test Engine</div>
      <StatusBar :summary="summary" />
      <div class="actions">
        <el-button @click="reload">加载</el-button>
        <el-button type="primary" :disabled="editorErrors.length > 0" @click="save">保存</el-button>
        <el-button type="success" :disabled="running" @click="run">运行</el-button>
        <el-button type="warning" :disabled="!running" @click="stop">停止</el-button>
      </div>
    </header>

    <main class="main">
      <section class="left">
        <TestTree :data="treeItems" :height="treeHeight" @click="select" />
      </section>
      <section class="right">
        <NodeEditor ref="editor" :node="selected" v-model:fields="fields" />
      </section>
    </main>

    <LogPanel :entries="logs" :files="logFiles" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import StatusBar from "./components/StatusBar.vue";
import TestTree from "./components/TestTree.vue";
import NodeEditor from "./components/NodeEditor.vue";
import LogPanel from "./components/LogPanel.vue";
import { getLogs, getTree, runTree, saveTree, stopTree } from "./api";
import { findNode, toTreeItems } from "./tree";
import type { LogEntry, ParamMeta, StatusSnapshot, TestNode } from "./types";

const tree = ref<TestNode[]>([]);
const selectedId = ref<string>();
const fields = ref<ParamMeta[]>([]);
const running = ref(false);
const logs = ref<LogEntry[]>([]);
const logFiles = ref({ jsonl: "", text: "" });
const states = ref<StatusSnapshot["nodes"]>([]);
const summary = ref({ total: 0, idle: 0, running: 0, success: 0, failed: 0, stopped: 0 });
const treeHeight = ref(480);
const editor = ref<{ errors: string[] }>();
let source: EventSource | undefined;

const selected = computed(() => (selectedId.value ? findNode(tree.value, selectedId.value) : undefined));
const treeItems = computed(() => toTreeItems(tree.value, states.value));
const editorErrors = computed(() => editor.value?.errors ?? []);

function select(id: string) {
  selectedId.value = id;
}

async function reload() {
  const data = await getTree();
  tree.value = data.tree as TestNode[];
  const logData = await getLogs();
  logs.value = logData.entries;
  logFiles.value = logData.files;
  ElMessage.success("已加载 JSON");
}

async function save() {
  if (editorErrors.value.length) {
    ElMessage.error(editorErrors.value[0]);
    return;
  }
  await saveTree(tree.value);
  ElMessage.success("已写入 JSON 文件");
}

async function run() {
  if (editorErrors.value.length) {
    ElMessage.error("请先修正参数约束");
    return;
  }
  await save();
  await runTree();
  running.value = true;
}

async function stop() {
  await stopTree();
}

function connectEvents() {
  source = new EventSource("/api/events");
  source.addEventListener("log", (ev) => {
    logs.value.push(JSON.parse((ev as MessageEvent).data));
    if (logs.value.length > 2000) logs.value.splice(0, logs.value.length - 2000);
  });
  source.addEventListener("logs", (ev) => {
    logs.value = JSON.parse((ev as MessageEvent).data);
  });
  source.addEventListener("status", (ev) => {
    const snap = JSON.parse((ev as MessageEvent).data) as StatusSnapshot;
    running.value = snap.running;
    states.value = snap.nodes ?? [];
    if (snap.summary) summary.value = snap.summary;
    if (snap.logFiles) logFiles.value = snap.logFiles;
  });
  source.addEventListener("done", () => {
    running.value = false;
    ElMessage.success("运行结束");
  });
}

function resize() {
  treeHeight.value = Math.max(280, window.innerHeight - 360);
}

onMounted(async () => {
  resize();
  window.addEventListener("resize", resize);
  await reload();
  connectEvents();
});

onUnmounted(() => {
  window.removeEventListener("resize", resize);
  source?.close();
});
</script>

<style scoped>
.shell {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr 220px;
}
.top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--panel);
  border-bottom: 1px solid var(--line);
}
.brand {
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-right: 8px;
}
.actions { margin-left: auto; display: flex; gap: 8px; }
.main {
  display: grid;
  grid-template-columns: minmax(280px, 42%) 1fr;
  min-height: 0;
}
.left, .right {
  min-height: 0;
  overflow: auto;
  background: var(--panel);
}
.left { border-right: 1px solid var(--line); padding: 8px 0; }
.right { padding: 12px 16px; background: var(--panel-2); }
</style>
