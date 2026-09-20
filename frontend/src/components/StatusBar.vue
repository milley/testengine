<template>
  <div class="bar">
    <el-tag effect="dark" type="info">总计 {{ summary.total }}</el-tag>
    <el-tag effect="dark">运行中 {{ summary.running }}</el-tag>
    <el-tag effect="dark" type="success">成功 {{ summary.success }}</el-tag>
    <el-tag effect="dark" type="danger">失败 {{ summary.failed }}</el-tag>
    <el-tag effect="dark" type="warning">停止 {{ summary.stopped }}</el-tag>
    <el-tag effect="plain">空闲 {{ summary.idle }}</el-tag>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  summary: {
    total: number;
    idle: number;
    running: number;
    success: number;
    failed: number;
    stopped: number;
  };
}>();
</script>

<style scoped>
.bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
