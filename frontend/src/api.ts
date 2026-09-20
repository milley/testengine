export async function getTree() {
  const res = await fetch("/api/tree");
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ path: string; tree: unknown }>;
}

export async function saveTree(tree: unknown) {
  const res = await fetch("/api/tree", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tree }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function runTree() {
  const res = await fetch("/api/run", { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function stopTree() {
  const res = await fetch("/api/stop", { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getStatus() {
  const res = await fetch("/api/status");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getLogs() {
  const res = await fetch("/api/logs");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
