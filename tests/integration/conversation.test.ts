import { connect, disconnect } from "../helpers/db";
import { registerAndLogin } from "../helpers/auth";
import { api } from "../helpers/api";
import { sleep } from "../helpers/socketClient";
import { Conversation } from "../../src/models/Conversation";
import { Message } from "../../src/models/Message";
import mongoose from "mongoose";

type TestUser = Awaited<ReturnType<typeof registerAndLogin>>;
let alice: TestUser, bob: TestUser, carol: TestUser, dave: TestUser;

const startConvo = (from: TestUser, to: TestUser) =>
  api(from.accessToken).post("/api/conversations", { userId: to.id });

// Users are created once (bcrypt is slow); only conversations/messages reset per test.
beforeAll(async () => {
  await connect();
  alice = await registerAndLogin({ username: "alice", email: "alice@example.com" });
  bob = await registerAndLogin({ username: "bob", email: "bob@example.com" });
  carol = await registerAndLogin({ username: "carol", email: "carol@example.com" });
  dave = await registerAndLogin({ username: "dave", email: "dave@example.com" });
});
afterEach(async () => {
  await Message.deleteMany({});
  await Conversation.deleteMany({});
});
afterAll(disconnect);

describe("POST /api/conversations", () => {
  it("creates a conversation with populated participants", async () => {
    const res = await startConvo(alice, bob);
    expect(res.status).toBe(200);
    expect(res.body.participants.map((p: any) => p._id).sort()).toEqual(
      [alice.id, bob.id].sort()
    );
    for (const p of res.body.participants) {
      expect(p).toMatchObject({ username: expect.any(String), email: expect.any(String) });
      expect(p).not.toHaveProperty("password");
    }
    expect(await Conversation.countDocuments()).toBe(1);
  });

  it("returns the existing conversation instead of creating a duplicate", async () => {
    const first = await startConvo(alice, bob);
    const second = await startConvo(alice, bob);
    expect(second.body._id).toBe(first.body._id);
    expect(await Conversation.countDocuments()).toBe(1);
  });

  it("finds the same conversation no matter who starts it", async () => {
    const first = await startConvo(alice, bob);
    const second = await startConvo(bob, alice);
    expect(second.body._id).toBe(first.body._id);
  });

  it("requires a userId", async () => {
    const res = await api(alice.accessToken).post("/api/conversations", {});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Participant id not provided");
  });

  it("does not let you start a conversation with yourself", async () => {
    const res = await startConvo(alice, alice);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/conversations", () => {
  it("lists only the caller's conversations, with participants populated", async () => {
    const mine = await startConvo(alice, bob);
    await startConvo(bob, carol); // alice is not part of this one

    const res = await api(alice.accessToken).get("/api/conversations");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]._id).toBe(mine.body._id);
    expect(res.body.data[0].participants[0]).not.toHaveProperty("password");
  });

  it("returns an empty page for a user with no conversations", async () => {
    const res = await api(dave.accessToken).get("/api/conversations");
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination).toMatchObject({ total: 0, totalPages: 0, hasMore: false });
  });

  it("orders by most recently updated first", async () => {
    const older = await startConvo(alice, bob);
    await sleep(10);
    const newer = await startConvo(alice, carol);

    const res = await api(alice.accessToken).get("/api/conversations");
    expect(res.body.data.map((c: any) => c._id)).toEqual([newer.body._id, older.body._id]);
  });

  it("paginates", async () => {
    await startConvo(alice, bob);
    await sleep(10);
    await startConvo(alice, carol);
    await sleep(10);
    await startConvo(alice, dave);

    const page1 = await api(alice.accessToken).get("/api/conversations?limit=2&page=1");
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.pagination).toEqual({
      page: 1, limit: 2, total: 3, totalPages: 2, hasMore: true,
    });

    const page2 = await api(alice.accessToken).get("/api/conversations?limit=2&page=2");
    expect(page2.body.data).toHaveLength(1);
    expect(page2.body.pagination.hasMore).toBe(false);
  });
});

// Each test below documents a bug that existed.
describe("known bugs (conversations)", () => {
  it("rejects a userId that does not exist", async () => {
    const ghost = new mongoose.Types.ObjectId().toString();
    const res = await api(alice.accessToken).post("/api/conversations", { userId: ghost });
    expect(res.status).toBe(404);
  });

  it("answers with an error (not a hang) for a malformed userId", async () => {
    const res = await api(alice.accessToken)
      .post("/api/conversations", { userId: "not-an-id" })
      .timeout(2000);
    expect(res.status).toBe(400);
  });

  it("search only returns conversations with a matching user", async () => {
    await startConvo(alice, bob);
    await startConvo(alice, carol);
    const res = await api(alice.accessToken).get("/api/conversations?search=bob");
    expect(res.body.data).toHaveLength(1);
  });

  it("search never leaks other people's conversations", async () => {
    await startConvo(alice, bob);
    await startConvo(bob, carol); // alice is not in this one
    const res = await api(alice.accessToken).get("/api/conversations?search=carol");
    for (const c of res.body.data) {
      expect(c.participants.map((p: any) => p._id)).toContain(alice.id);
    }
  });

  it("search with regex characters does not crash", async () => {
    const res = await api(alice.accessToken).get("/api/conversations").query({ search: "(" });
    expect(res.status).not.toBe(500);
  });

  it("moves a conversation to the top when a message is sent in it", async () => {
    const first = (await startConvo(alice, bob)).body._id;
    await sleep(10);
    await startConvo(alice, carol);
    await sleep(10);
    await api(alice.accessToken).post("/api/messages", { conversationId: first, content: "bump" });

    const res = await api(alice.accessToken).get("/api/conversations");
    expect(res.body.data[0]._id).toBe(first);
  });
});