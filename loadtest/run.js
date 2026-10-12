// Node 18+. Uses the socket.io-client you already have installed.
const { io } = require("socket.io-client");
const fs = require("fs");

const URL = process.env.URL || "http://localhost:5000";
const PAIRS = Number(process.env.PAIRS || 50);        // 2 connections per pair
const DURATION = Number(process.env.DURATION || 30);  // seconds of steady sending
const RATE = Number(process.env.RATE || 1);           // messages/sec per sender
const RAMP = Number(process.env.RAMP || 20);          // pairs connected per second
const PASSWORD = "Load@1234";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const runId = Date.now().toString(36);
const allSockets = [];
const stats = { connectOk: 0, connectFail: 0, connectMs: [], sent: 0, received: 0, latencies: [], errors: 0 };

const pct = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
};

const post = async (path, body, token) => {
  const res = await fetch(URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
};

// Runs fn over items with at most `size` in flight (bcrypt on the server is slow).
const pool = async (items, size, fn) => {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    })
  );
  return out;
};

const seed = async () => {
  console.log(`Seeding ${PAIRS * 2} users and ${PAIRS} conversations...`);
  const users = await pool(Array.from({ length: PAIRS * 2 }, (_, i) => i), 10, async (i) => {
    const email = `lt${runId}_${i}@load.test`;
    await post("/api/auth/register", { username: `lt${runId}_${i}`, email, password: PASSWORD });
    const login = await post("/api/auth/login", { email, password: PASSWORD });
    return { id: login.user.id, token: login.accessToken };
  });
  return pool(Array.from({ length: PAIRS }, (_, i) => i), 10, async (i) => {
    const a = users[i * 2], b = users[i * 2 + 1];
    const convo = await post("/api/conversations", { userId: b.id }, a.token);
    return { a, b, conversationId: convo._id };
  });
};

const connectOne = (token) =>
  new Promise((resolve, reject) => {
    const t0 = Date.now();
    const s = io(URL, { auth: { token }, transports: ["websocket"], reconnection: false, forceNew: true });
    allSockets.push(s);
    let done = false;
    const fail = (e) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      stats.connectFail++;
      reject(e instanceof Error ? e : new Error(String(e)));
    };
    const timer = setTimeout(() => fail(new Error("connect timeout")), 10000);
    s.once("connect", () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      stats.connectOk++;
      stats.connectMs.push(Date.now() - t0);
      resolve(s);
    });
    s.once("connect_error", fail);
  });

const join = (s, conversationId) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("join timeout")), 10000);
    s.once("joined", () => { clearTimeout(timer); resolve(); });
    s.emit("joinConversation", { conversationId });
  });

const setupPair = async (pair) => {
  try {
    const [a, b] = await Promise.all([connectOne(pair.a.token), connectOne(pair.b.token)]);
    for (const s of [a, b]) s.on("error", () => stats.errors++);
    b.on("private-message", (m) => {
      if (typeof m.content === "string" && m.content.startsWith("lt:") && m.sender === pair.a.id) {
        stats.received++;
        stats.latencies.push(Date.now() - Number(m.content.split(":")[1]));
      }
    });
    await Promise.all([join(a, pair.conversationId), join(b, pair.conversationId)]);
    return { a, b };
  } catch {
    return null;
  }
};

(async () => {
  const pairs = await seed();

  console.log(`Connecting ${PAIRS} pairs at ${RAMP} pairs/sec...`);
  const live = [];
  await Promise.all(
    pairs.map(async (pair, i) => {
      await sleep((i / RAMP) * 1000);
      const ready = await setupPair(pair);
      if (ready) live.push(ready);
    })
  );
  console.log(`${live.length}/${PAIRS} pairs ready. Sending for ${DURATION}s...`);

  const interval = 1000 / RATE;
  const timers = [];
  for (const { a } of live) {
    let seq = 0;
    setTimeout(() => {
      timers.push(
        setInterval(() => {
          stats.sent++;
          a.emit("sendMessage", { content: `lt:${Date.now()}:${seq++}` });
        }, interval)
      );
    }, Math.random() * interval);
  }
  await sleep(DURATION * 1000);
  timers.forEach(clearInterval);
  await sleep(3000); // let in-flight messages arrive

  const lat = stats.latencies;
  const result = {
    pairs: PAIRS,
    connections_ok: stats.connectOk,
    connections_failed: stats.connectFail,
    connect_p95_ms: pct(stats.connectMs, 95),
    messages_sent: stats.sent,
    messages_received: stats.received,
    loss_pct: stats.sent ? Number((((stats.sent - stats.received) / stats.sent) * 100).toFixed(2)) : null,
    throughput_msgs_per_s: Number((stats.received / DURATION).toFixed(1)),
    latency_p50_ms: pct(lat, 50),
    latency_p95_ms: pct(lat, 95),
    latency_p99_ms: pct(lat, 99),
    latency_max_ms: lat.length ? Math.max(...lat) : null,
    server_error_events: stats.errors,
  };
  console.table(result);
  fs.writeFileSync(`loadtest/result-${PAIRS}pairs.json`, JSON.stringify(result, null, 2));

  allSockets.forEach((s) => s.close());
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});