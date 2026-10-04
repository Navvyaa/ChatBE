import mongoose from "mongoose";
import { connect, disconnect } from "../helpers/db";
import { registerAndLogin } from "../helpers/auth";
import { api } from "../helpers/api";
import { Conversation } from "../../src/models/Conversation";
import { Message } from "../../src/models/Message";
import { getIO } from "../../src/socket/io";

type TestUser = Awaited<ReturnType<typeof registerAndLogin>>;
let alice: TestUser, bob: TestUser, carol: TestUser;
let convoId: string;

beforeAll(async () => {
  await connect();
  alice = await registerAndLogin({ username: "alice", email: "alice@example.com" });
  bob = await registerAndLogin({ username: "bob", email: "bob@example.com" });
  carol = await registerAndLogin({ username: "carol", email: "carol@example.com" });
});
beforeEach(async () => {
  convoId = (await Conversation.create({ participants: [new mongoose.Types.ObjectId(alice.id),new mongoose.Types.ObjectId(bob.id)] }))._id.toString();
});
afterEach(async () => {
  jest.restoreAllMocks();
  await Message.deleteMany({});
  await Conversation.deleteMany({});
});
afterAll(disconnect);

// Replaces io.to(room).emit(...) with a spy so we can assert on what would be sent.
const mockEmit = () => {
  const emit = jest.fn();
  const to = jest.spyOn(getIO(), "to").mockReturnValue({ emit } as any);
  return { emit, to };
};

// Seeds messages with fixed, 1s-apart timestamps so ordering/cursors are deterministic.
const seed = (from: TestUser, to: TestUser, n: number, extra: object = {}) => {
  const base = Date.now() - 60_000;
  return Message.create(
    Array.from({ length: n }, (_, i) => ({
      conversation: convoId,
      sender: from.id,
      receiver: to.id,
      content: `m${i + 1}`,
      createdAt: new Date(base + (i + 1) * 1000),
      ...extra,
    }))
  );
};

describe("POST /api/messages", () => {
  const send = (user: TestUser, body: object) =>
    api(user.accessToken).post("/api/messages", body);

  it("requires conversationId and content", async () => {
    expect((await send(alice, { content: "hi" })).status).toBe(400);
    expect((await send(alice, { conversationId: convoId })).status).toBe(400);
  });

  it("returns 404 for an unknown conversation", async () => {
    const res = await send(alice, {
      conversationId: new mongoose.Types.ObjectId().toString(),
      content: "hi",
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 for a non-participant", async () => {
    const res = await send(carol, { conversationId: convoId, content: "let me in" });
    expect(res.status).toBe(403);
    expect(await Message.countDocuments()).toBe(0);
  });

  it("creates and stores the message with the right sender and receiver", async () => {
    const res = await send(alice, { conversationId: convoId, content: "hi bob" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ content: "hi bob", sender: alice.id, receiver: bob.id });

    const saved = await Message.findById(res.body._id);
    expect(saved!.delivered).toBe(false);
    expect(saved!.read).toBe(false);
  });

  it("emits private-message to the receiver's room", async () => {
    const { emit, to } = mockEmit();
    await send(alice, { conversationId: convoId, content: "hi bob" });

    expect(to).toHaveBeenCalledWith(bob.id);
    expect(emit.mock.calls[0][0]).toBe("private-message");
    expect(emit.mock.calls[0][1].content).toBe("hi bob");
  });

  it("POST answers 400 for a malformed conversationId", async () => {
    const res = await api(alice.accessToken)
      .post("/api/messages", { conversationId: "not-an-id", content: "hi" })
      .timeout(2000);
    expect(res.status).toBe(400);
  });

});

describe("GET /api/messages/:conversationId", () => {
  const fetchMessages = (user: TestUser, query = "") =>
    api(user.accessToken).get(`/api/messages/${convoId}${query}`);

  it("returns 404 for an unknown conversation", async () => {
    const res = await api(alice.accessToken).get(
      `/api/messages/${new mongoose.Types.ObjectId()}`
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 for a non-participant", async () => {
    expect((await fetchMessages(carol)).status).toBe(403);
  });

  it("returns messages oldest-first with sender and receiver populated", async () => {
    await seed(alice, bob, 3);
    const res = await fetchMessages(alice);

    expect(res.status).toBe(200);
    expect(res.body.data.map((m: any) => m.content)).toEqual(["m1", "m2", "m3"]);
    expect(res.body.data[0].sender).toMatchObject({ username: "alice", email: alice.email });
    expect(res.body.data[0].receiver).toMatchObject({ username: "bob" });
    expect(res.body.data[0].sender).not.toHaveProperty("password");
  });

  it("paginates", async () => {
    await seed(alice, bob, 5);

    const page1 = await fetchMessages(alice, "?limit=2&page=1");
    expect(page1.body.data.map((m: any) => m.content)).toEqual(["m1", "m2"]);
    expect(page1.body.pagination).toEqual({
      page: 1, limit: 2, total: 5, totalPages: 3, hasMore: true,
    });

    const page3 = await fetchMessages(alice, "?limit=2&page=3");
    expect(page3.body.data.map((m: any) => m.content)).toEqual(["m5"]);
    expect(page3.body.pagination.hasMore).toBe(false);
  });

  it("supports the `before` cursor (older messages, still oldest-first)", async () => {
    const msgs = await seed(alice, bob, 3);
    const res = await fetchMessages(alice, `?before=${msgs[2].createdAt.getTime()}`);
    expect(res.body.data.map((m: any) => m.content)).toEqual(["m1", "m2"]);
  });

  it("supports the `after` cursor (newer messages)", async () => {
    const msgs = await seed(alice, bob, 3);
    const res = await fetchMessages(alice, `?after=${msgs[1].createdAt.getTime()}`);
    expect(res.body.data.map((m: any) => m.content)).toEqual(["m3"]);
  });

  it("marks messages delivered when the receiver fetches them, and notifies the sender", async () => {
    const [msg] = await seed(alice, bob, 1);
    const { emit, to } = mockEmit();

    await fetchMessages(bob);

    const saved = await Message.findById(msg._id);
    expect(saved!.delivered).toBe(true);
    expect(saved!.deliveredAt).toBeInstanceOf(Date);
    expect(to).toHaveBeenCalledWith(alice.id);
    expect(emit).toHaveBeenCalledWith("message-delivered", expect.anything());
  });

  it("does not mark messages delivered when the sender fetches their own", async () => {
    const [msg] = await seed(alice, bob, 1);
    const { emit } = mockEmit();

    await fetchMessages(alice);

    expect((await Message.findById(msg._id))!.delivered).toBe(false);
    expect(emit).not.toHaveBeenCalled();
  });

  it("GET answers 400 for a malformed conversationId", async () => {
    const res = await api(alice.accessToken).get("/api/messages/not-an-id");
    expect(res.status).toBe(400);
  });
});

