import express from "express";
import cors from "cors";
import { getEngine } from "./engine.js";
import { getLogger } from "./logger.js";
import type { TestNode } from "./types.js";

const app = express();
const engine = getEngine();
const log = getLogger();

app.use(cors());
app.use(express.json({ limit: "8mb" }));

app.get("/api/tree", (_req, res) => {
  res.json({ path: engine.jsonPath, tree: engine.tree });
});

app.put("/api/tree", (req, res) => {
  try {
    const tree = req.body.tree as TestNode[];
    if (!Array.isArray(tree)) {
      res.status(400).json({ error: "body.tree must be an array" });
      return;
    }
    engine.save(tree);
    res.json({ ok: true, path: engine.jsonPath });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/run", async (_req, res) => {
  try {
    void engine.run();
    res.json({ ok: true, status: "running" });
  } catch (err) {
    res.status(409).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/stop", (_req, res) => {
  engine.stop();
  res.json({ ok: true });
});

app.get("/api/status", (_req, res) => {
  res.json(engine.snapshot());
});

app.get("/api/logs", (_req, res) => {
  res.json({
    files: { jsonl: log.jsonlFile, text: log.textFile },
    entries: log.recent(1000),
  });
});

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send("status", engine.snapshot());
  send("logs", log.recent(200));

  const onLog = (entry: unknown) => send("log", entry);
  const onStatus = (payload: unknown) => send("status", { ...engine.snapshot(), ...((payload as object) ?? {}) });
  const onDone = (payload: unknown) => send("done", payload);

  log.on("log", onLog);
  engine.on("status", onStatus);
  engine.on("done", onDone);

  req.on("close", () => {
    log.off("log", onLog);
    engine.off("status", onStatus);
    engine.off("done", onDone);
  });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  log.info(`HTTP API listening on http://127.0.0.1:${port}`);
  console.log(`HTTP API listening on http://127.0.0.1:${port}`);
});
