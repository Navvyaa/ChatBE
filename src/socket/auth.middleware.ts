import jwt from "jsonwebtoken";
import { Socket } from "socket.io";

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.token;

    if (!token) {
      return next(new Error("Unauthorized socket"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    socket.data.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error("Unauthorized socket"));
  }
};
