import { Server } from "socket.io";
import { socketAuthMiddleware } from "./auth.middleware";
import { registerChatHandlers } from "./chat";

export const registerSocketHandlers= (io:Server)=>{
    io.use(socketAuthMiddleware);
    io.on("connection",(socket)=>{
        registerChatHandlers(io,socket)
    })
}