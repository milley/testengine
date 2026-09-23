<template>
  <div class="shell">
    <header class="top">
      <div class="brand">Test Engine</div>
      <StatusBar :summary="summary" />
      <div class="actions">
        <el-select
          v-model="currentFile"
          placeholder="配置文件"
          style="width: 180px"
          :loading="busy"
          @change="switchConfig"
        >
          <el-option v-for="file in configs" :key="file" :label="file" :value="file" />
        </el-select>
        <el-button @click="openPicker">加载</el-button>
        <el-button type="primary" :disabled="editorErrors.length > 0 || busy" @click="save">保存</el-button>
        <el-button type="success" :disabled="running || busy" @click="run">运行</el-button>
        <el-button type="warning" :disabled="!running" @click="stop">停止</el-button>
      </div>
    </header>

    <main class="main">
      <section class="left">
        <div class="tree-meta">当前：{{ currentFile || "未加载" }} · {{ tree.length }} 个根节点</div>
        <TestTree :key="treeKey" :data="treeItems" :height="treeHeight" @click="select" />
      </section>
      <section class="right">
        <NodeEditor ref="editor" :node="selected" v-model:fields="fields" />
      </section>
    </main>

    <LogPanel :entries="logs" :files="logFiles" />

    <el-dialog v-model="pickerOpen" title="选择 JSON 配置" width="420px">
      <p class="hint">从工程目录加载测试树，选中后展示在左侧。</p>
      <el-radio-group v-model="pickedFile" class="file-list">
        <el-radio v-for="file in configs" :key="file" :value="file" :label="file" border>
          {{ file }}
        </el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="pickerOpen = false">取消</el-button>
        <el-button type="primary" :disabled="!pickedFile" :loading="busy" @click="confirmPicker">加载并展示</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import StatusBar from "./components/StatusBar.vue";
import TestTree from "./components/TestTree.vue";
import NodeEditor from "./components/NodeEditor.vue";
import LogPanel from "./components/LogPanel.vue";
import { getLogs, getTree, listConfigs, loadConfig, runTree, saveTree, stopTree } from "./api";
import { findNode, toTreeItems } from "./tree";
import type { LogEntry, ParamMeta, StatusSnapshot, TestNode } from "./types";

const tree = ref<TestNode[]>([]);
const configs = ref<string[]>([]);
const currentFile = ref("");
const pickedFile = ref("demo.json");
const pickerOpen = ref(false);
const busy = ref(false);
const selectedId = ref<string>();
const fields = ref<ParamMeta[]>([]);
const running = ref(false);
const logs = ref<LogEntry[]>([]);
const logFiles = ref({ jsonl: "", text: "" });
const states = ref<StatusSnapshot["nodes"]>([]);
const summary = ref({ total: 0, idle: 0, running: 0, success: 0, failed: 0, stopped: 0 });
const treeHeight = ref(480);
const treeKey = ref(0);
const editor = ref<{ errors: string[] }>();
let source: EventSource | undefined;

const selected = computed(() => (selectedId.value ? findNode(tree.value, selectedId.value) : undefined));
const treeItems = computed(() => toTreeItems(tree.value, states.value));
const editorErrors = computed(() => editor.value?.errors ?? []);

function fail(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message.replace(/<[^>]+>/g, " ").trim() : fallback;
  ElMessage.error(message.slice(0, 180) || fallback);
}

function applyTree(nodes: TestNode[], file?: string) {
  tree.value = nodes;
  selectedId.value = undefined;
  treeKey.value += 1;
  if (file) currentFile.value = file;
}

async function refreshLogs() {
  try {
    const logData = await getLogs();
    logs.value = logData.entries ?? [];
    if (logData.files) logFiles.value = logData.files;
  } catch {
    /* logs are optional */
  }
}

async function refreshConfigs() {
  const listed = await listConfigs();
  configs.value = listed.files ?? [];
  currentFile.value = listed.current || currentFile.value;
  if (!pickedFile.value || !configs.value.includes(pickedFile.value)) {
    pickedFile.value = listed.current || configs.value[0] || "demo.json";
  }
  return listed;
}

async function reload() {
  busy.value = true;
  try {
    try {
      await refreshConfigs();
    } catch (err) {
      fail(err, "读取配置列表失败，仍尝试加载当前树");
    }
    const data = await getTree();
    const file = data.path ? data.path.split(/[\\/]/).pop() : currentFile.value;
    applyTree((data.tree as TestNode[]) ?? [], file);
    await refreshLogs();
    ElMessage.success(`已加载 ${file || "测试树"}`);
  } catch (err) {
    fail(err, "加载测试树失败");
  } finally {
    busy.value = false;
  }
}

async function switchConfig(file: string) {
  if (!file) return;
  busy.value = true;
  try {
    const loaded = await loadConfig(file);
    applyTree((loaded.tree as TestNode[]) ?? [], file);
    await refreshLogs();
    ElMessage.success(`已切换到 ${file}`);
  } catch (err) {
    fail(err, `加载 ${file} 失败`);
    try {
      const listed = await listConfigs();
      currentFile.value = listed.current;
    } catch {
      /* ignore */
    }
  } finally {
    busy.value = false;
  }
}

async function openPicker() {
  pickerOpen.value = true;
  try {
    await refreshConfigs();
  } catch (err) {
    fail(err, "无法列出配置文件，请确认 API 已重启");
  }
}

async function confirmPicker() {
  const file = pickedFile.value;
  pickerOpen.value = false;
  await switchConfig(file);
}

async function save() {
  if (editorErrors.value.length) {
    ElMessage.error(editorErrors.value[0]);
    return;
  }
  try {
    await saveTree(tree.value);
    ElMessage.success("已写入 JSON 文件");
  } catch (err) {
    fail(err, "保存失败");
  }
}

async function run() {
  if (editorErrors.value.length) {
    ElMessage.error("请先修正参数约束");
    return;
  }
  await save();
  try {
    await runTree();
    running.value = true;
  } catch (err) {
    fail(err, "运行失败");
  }
}

async function stop() {
  try {
    await stopTree();
  } catch (err) {
    fail(err, "停止失败");
  }
}

function select(id: string) {
  selectedId.value = id;
}

function connectEvents() {
  source?.close();
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
  treeHeight.value = Math.max(280, window.innerHeight - 400);
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
.actions { margin-left: auto; display: flex; gap: 8px; align-items: center; }
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
.tree-meta {
  padding: 0 12px 8px;
  color: var(--muted);
  font-size: 12px;
}
.hint {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 13px;
}
.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
</style>
