# testengine

跨语言测试编排：Vue 配置界面 + Node.js 解析/执行 + C++ core/stub。

## 目录

```
testengine/
├── frontend/            Vue 3 + Element Plus
├── src/                 Node.js testengine + HTTP API
├── idl/test_service.thrift
├── core/                C++ dummy Thrift 服务
├── stub/                C++ DLL 桩
├── simple.json
└── logs/                JSONL + 文本日志
```

## 启动界面

```bash
cd testengine
npm install
chmod +x scripts/dev.sh
./scripts/dev.sh
```

浏览器打开 http://127.0.0.1:5173

- 左侧树：文件夹展开/收起，节点状态
- 顶部：运行状态汇总
- 右侧：属性表单（不弹窗）
- 底部：日志（同时写入 `logs/testengine-YYYY-MM-DD.log` 和 `.jsonl`）
- 保存：点击「保存」才写 JSON
- 运行/停止：串行执行，可中途停止

## 仅命令行

```bash
npx tsx src/main.ts parse --tree ./simple.json --expand
npx tsx src/main.ts run --tree ./simple.json
npx tsx src/api_server.ts   # HTTP API :3000
```
