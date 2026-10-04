import mongoose from "mongoose";
import { Socket } from "socket.io-client";
import { registerAndLogin } from "../helpers/auth";
import { startTestServer } from "../helpers/socketServer";
import { connectClient, sleep, waitFor } from "../helpers/socketClient";
import { connect, clear, disconnect } from "../helpers/db";
import { Conversation } from "../../src/models/Conversation";
import { Message } from "../../src/models/Message";
import { User } from "../../src/models/User";

type TestUser = Awaited<ReturnType<typeof registerAndLogin>>;

let server: Awaited<ReturnType<typeof startTestServer>>;
let clients: Socket[] = [];
let alice: TestUser, bob: TestUser, carol: TestUser;
let conversationId: string;

const connectAs = async (user: TestUser) => {
    const socket = await connectClient(server.url, user.accessToken);
    clients.push(socket);
    return socket;
}

const join = async (socket: Socket, id = conversationId) => {
    const joined = waitFor(socket, "joined");
    socket.emit("joinConversation", { conversationId: id });
    await joined;
}

beforeAll(async()=>{
    await connect();
    server= await startTestServer();
});

afterAll(async ()=>{
    await sleep(100);
    await server.close();
    await disconnect();
});

beforeEach(async ()=>{
    alice=await registerAndLogin({username:"alice",email:"alice@example.com"})
    bob=await registerAndLogin({username:"bob",email:"bobe@example.com"})
    carol=await registerAndLogin({username:"carol",email:"carol@example.com"})
    const convo=await Conversation.create({participants:[
        new mongoose.Types.ObjectId(alice.id),
        new mongoose.Types.ObjectId(bob.id)
    ]});
    conversationId=convo._id.toString();
});

afterEach(async() =>{
    clients.forEach((c)=>c.close());
    clients=[];
    await sleep(50);
    await clear();
});

describe("connection auth", () => {
  it("rejects a connection without a token", async () => {
    await expect(connectClient(server.url, "")).rejects.toThrow("Unauthorized socket");
  });

  it("rejects an invalid token", async () => {
    await expect(connectClient(server.url, "garbage")).rejects.toThrow("Unauthorized socket");
  });

  it("accepts a valid token", async () => {
    const socket = await connectAs(alice);
    expect(socket.connected).toBe(true);
  });
});


describe("joining conversations", () => {
  it("lets a participant join", async () => {
    const a = await connectAs(alice);
    const joined = waitFor(a, "joined");
    a.emit("joinConversation", { conversationId });
    expect(await joined).toEqual({ conversationId });
  });

  it("denies a non-participant", async () => {
    const c = await connectAs(carol);
    const err = waitFor(c, "error");
    c.emit("joinConversation", { conversationId });
    expect((await err).message).toBe("Access Denied");
  });

  it("reports a conversation that does not exist", async () => {
    const a = await connectAs(alice);
    const err = waitFor(a, "error");
    a.emit("joinConversation", { conversationId: new mongoose.Types.ObjectId().toString() });
    expect((await err).message).toBe("Conversation not found");
  });

  it("joins several conversations and reports per-conversation status", async () => {
    const other = await Conversation.create({ participants: [
        new mongoose.Types.ObjectId(bob.id),
        new mongoose.Types.ObjectId(carol.id)
    ]});
    const otherId = other._id.toString();

    const a = await connectAs(alice);
    const result = waitFor(a, "joinedMultiple");
    a.emit("joinedMultipleConversations", { conversationIds: [conversationId, otherId] });

    expect((await result).results).toEqual([
      { conversationId, status: "joined" },
      { conversationId: otherId, status: "denied" },
    ]);
  });
});


describe("messaging", () => {
  it("delivers a message to the other participant and saves it", async () => {
    const a = await connectAs(alice);
    const b = await connectAs(bob);
    await join(a);
    await join(b);

    const received = waitFor(b, "private-message");
    a.emit("sendMessage", { content: "hello bob" });
    const msg = await received;

    expect(msg.content).toBe("hello bob");
    expect(msg.sender).toBe(alice.id);
    const saved = await Message.findById(msg._id);
    expect(saved).not.toBeNull();
    expect(saved!.receiver.toString()).toBe(bob.id);
  });

  it("marks the message delivered when the receiver is online", async () => {
    const a = await connectAs(alice);
    await connectAs(bob); // online, but has not joined the conversation
    await join(a);

    const delivered = waitFor(a, "message-delivered");
    a.emit("sendMessage", { content: "are you there" });
    const { messageId } = await delivered;

    const saved = await Message.findById(messageId);
    expect(saved!.delivered).toBe(true);
  });

  it("leaves the message undelivered when the receiver is offline", async () => {
    const a = await connectAs(alice);
    await join(a);

    const sent = waitFor(a, "private-message");
    a.emit("sendMessage", { content: "anyone?" });
    const msg = await sent;
    await sleep(200);

    const saved = await Message.findById(msg._id);
    expect(saved!.delivered).toBe(false);
  });

  it("requires joining a conversation first", async () => {
    const a = await connectAs(alice);
    const err = waitFor(a, "error");
    a.emit("sendMessage", { content: "hi" });
    expect((await err).message).toBe("You must join a conversation first.");
  });

  it("rejects empty content", async () => {
    const a = await connectAs(alice);
    await join(a);
    const err = waitFor(a, "error");
    a.emit("sendMessage", { content: "" });
    expect((await err).message).toBe("Content is required");
  });

  it("does not leak messages to users outside the conversation", async () => {
    const a = await connectAs(alice);
    const c = await connectAs(carol);
    const spy = jest.fn();
    c.on("private-message", spy);
    await join(a);

    const sent = waitFor(a, "private-message");
    a.emit("sendMessage", { content: "private" });
    await sent;
    await sleep(200);

    expect(spy).not.toHaveBeenCalled();
  });
});

describe("read receipts", () => {
  it("marks messages as read when the receiver joins", async () => {
    const a = await connectAs(alice);
    const b = await connectAs(bob);
    await join(a);

    const sent = waitFor(a, "private-message");
    const delivered = waitFor(a, "message-delivered");
    a.emit("sendMessage", { content: "read me" });
    const msg = await sent;
    await delivered;

    const read = waitFor(a, "messages-read");
    await join(b);
    expect(await read).toMatchObject({ conversationId, readBy: bob.id, count: 1 });

    const saved = await Message.findById(msg._id);
    expect(saved!.read).toBe(true);
    expect(saved!.readAt).toBeDefined();
  });
});

describe("typing indicators", () => {
  it("notifies the other participant on start and stop", async () => {
    const a = await connectAs(alice);
    const b = await connectAs(bob);
    await join(a);
    await join(b);

    const started = waitFor(b, "user-typing");
    a.emit("typing-start");
    expect(await started).toMatchObject({ conversationId, userId: alice.id, isTyping: true });

    const stopped = waitFor(b, "user-typing");
    a.emit("typing-stop");
    expect(await stopped).toMatchObject({ userId: alice.id, isTyping: false });
  });

  it("does not echo the event back to the sender", async () => {
    const a = await connectAs(alice);
    const b = await connectAs(bob);
    await join(a);
    await join(b);
    const spy = jest.fn();
    a.on("user-typing", spy);

    const received = waitFor(b, "user-typing");
    a.emit("typing-start");
    await received;
    await sleep(100);

    expect(spy).not.toHaveBeenCalled();
  });

  it("requires joining a conversation first", async () => {
    const a = await connectAs(alice);
    const err = waitFor(a, "error");
    a.emit("typing-start");
    expect((await err).message).toBe("Join a conversation first.");
  });
});


describe("presence", () => {
  it("broadcasts ONLINE to others and stores the status", async () => {
    const b = await connectAs(bob);
    const online = waitFor(b, "user-status-changed", (e: any) => e.userId === alice.id);
    await connectAs(alice);

    expect(await online).toMatchObject({ userId: alice.id, status: "ONLINE" });
    const user = await User.findById(alice.id);
    expect(user!.status).toBe("ONLINE");
  });

  it("broadcasts OFFLINE on disconnect and stores the status", async () => {
    const a = await connectAs(alice);
    const b = await connectAs(bob);
    const offline = waitFor(
      b,
      "user-status-changed",
      (e: any) => e.userId === alice.id && e.status === "OFFLINE"
    );
    a.close();

    expect(await offline).toMatchObject({ userId: alice.id, status: "OFFLINE" });
    const user = await User.findById(alice.id);
    expect(user!.status).toBe("OFFLINE");
  });
});