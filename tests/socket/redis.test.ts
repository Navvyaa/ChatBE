import { Socket } from "socket.io-client";
import { connect, clear, disconnect } from "../helpers/db";
import { startTestServer } from "../helpers/socketServer";
import { registerAndLogin } from "../helpers/auth";
import { connectClient, waitFor, sleep } from "../helpers/socketClient";
import { Conversation } from "../../src/models/Conversation";
import { Message } from "../../src/models/Message";
import mongoose from "mongoose";

type TestUser = Awaited<ReturnType<typeof registerAndLogin>>;
type Node = Awaited<ReturnType<typeof startTestServer>>;

const redisUrl = process.env.REDIS_URL;
const suite = redisUrl ? describe : describe.skip;

suite("multiple server instances (Redis adapter)", () => {
  let nodeA: Node, nodeB: Node;
  let alice: TestUser, bob: TestUser;
  let conversationId: string;
  let clients: Socket[] = [];

  const connectAs = async (node: Node, user: TestUser) => {
    const s = await connectClient(node.url, user.accessToken);
    clients.push(s);
    return s;
  };

  const join = async (socket: Socket) => {
    const joined = waitFor(socket, "joined");
    socket.emit("joinConversation", { conversationId });
    await joined;
  };

  beforeAll(async () => {
    await connect();
    nodeA = await startTestServer(redisUrl);
    nodeB = await startTestServer(redisUrl);
  });

  afterAll(async () => {
    await sleep(100);
    await nodeA.close();
    await nodeB.close();
    await disconnect();
  });

  beforeEach(async () => {
    alice = await registerAndLogin({ username: "alice", email: "alice@example.com" });
    bob = await registerAndLogin({ username: "bob", email: "bob@example.com" });
    conversationId = (
      await Conversation.create({ participants: [new mongoose.Types.ObjectId(alice.id),new mongoose.Types.ObjectId(bob.id)] })
    )._id.toString();
  });

  afterEach(async () => {
    clients.forEach((c) => c.close());
    clients = [];
    await sleep(100);
    await clear();
  });

  it("delivers a message between users on different instances", async () => {
    const a = await connectAs(nodeA, alice);
    const b = await connectAs(nodeB, bob);
    await join(a);
    await join(b);

    const received = waitFor(b, "private-message");
    a.emit("sendMessage", { content: "across nodes" });
    expect((await received).content).toBe("across nodes");
  });

  it("sees a receiver connected to another instance as online (delivered)", async () => {
    const a = await connectAs(nodeA, alice);
    await connectAs(nodeB, bob); // online, but on the other instance, not joined
    await join(a);

    const delivered = waitFor(a, "message-delivered");
    a.emit("sendMessage", { content: "are you there" });
    const { messageId } = await delivered;

    expect((await Message.findById(messageId))!.delivered).toBe(true);
  });

  it("broadcasts presence across instances", async () => {
    const a = await connectAs(nodeA, alice);
    const online = waitFor(a, "user-status-changed", (e: any) => e.userId === bob.id);
    await connectAs(nodeB, bob);
    expect(await online).toMatchObject({ userId: bob.id, status: "ONLINE" });
  });

  it("keeps a user ONLINE while a connection on another instance is open", async () => {
    const a = await connectAs(nodeA, alice);
    const bobOnA = await connectAs(nodeA, bob);
    await connectAs(nodeB, bob);

    const spy = jest.fn();
    a.on("user-status-changed", (e: any) => {
      if (e.userId === bob.id && e.status === "OFFLINE") spy();
    });

    bobOnA.close();
    await sleep(400);
    expect(spy).not.toHaveBeenCalled();
  });
});