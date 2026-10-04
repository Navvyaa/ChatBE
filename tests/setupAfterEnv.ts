import { Server } from "socket.io";
import { setIO } from "../src/socket/io";

beforeAll(()=>{
    setIO(new Server());
})