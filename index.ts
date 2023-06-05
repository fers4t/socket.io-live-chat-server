import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { ChatMessage, Client } from "./types";
import signale from "signale";
// TODO: #1 add MongoDB authentication

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const clients: Client[] = [];
const chatMessages: ChatMessage[] = [];

io.use((socket: Socket, next) => {
  const name = socket.handshake.auth?.name;

  if (!name) {
    signale.error(`Client has not name, disconnected.`);
    return next(new Error("invalid name"));
  }

  const client: Client = {
    id: socket.id,
    name,
    socket,
  };
  clients.push(client);
  signale.info(`Client connected: ${name} : ${socket.id}`);
  // @ts-ignore
  socket.username = name;
  next();
});

io.on("connection", (socket: Socket) => {
  socket.on("chatMessage", ({ target, content, ...rest }: ChatMessage) => {
    console.log({ target, content, rest });

    const sender =
      clients.find((client) => client.id === socket.id)?.name || "Unknown";
    const from = clients.find((client) => client.name === target);

    console.log({ socket });

    if (from) {
      const chatMessage: ChatMessage = {
        id: socket.id,
        sender,
        target: from.name,
        content,
        timestamp: Date.now(),
      };
      chatMessages.push(chatMessage);
      io.to(from!.socket.id).emit("chatMessage", chatMessage);

      if (process.env.NODE_ENV === "development") {
        io.to(from!.socket.id).emit("message", chatMessage);
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        io.send(`target not found: ${target}`);
      }
    }
  });

  // Handle disconnect event
  socket.on("disconnect", () => {
    console.log("A user disconnected.");

    // Remove the client from the list
    const clientIndex = clients.findIndex((client) => client.id === socket.id);
    if (clientIndex !== -1) {
      const disconnectedClient = clients.splice(clientIndex, 1)[0];
      console.log(`Client disconnected: ${disconnectedClient.name}`);

      // Notify all clients about the disconnected client
      io.emit("clientDisconnected", disconnectedClient);
    }
  });
});

const port = 8000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
