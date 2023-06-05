import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { ChatMessage, Client } from "../types/types";
import signale from "../lib/signale";
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

  const _socket = {
    handshake: socket.handshake,
    id: socket.id,
    name,
  };

  const client: Client = _socket;
  clients.push(client);

  signale.scope("clients").monitor(
    clients.map((client) => {
      return {
        id: client.id,
        name: client.name,
      };
    })
  );
  signale.connection(`Client connected: ${name} : ${socket.id}`);
  // @ts-ignore
  socket.username = name;
  next();
});

io.on("connection", (socket: Socket) => {
  socket.on("chatMessage", ({ target, content }: ChatMessage) => {
    const sender = clients.find((client) => client.id === socket.id);
    const targetClient = clients.find((client) => client.id === target);

    if (targetClient && sender) {
      const chatMessage: ChatMessage = {
        sender: sender.id,
        target: targetClient.id,
        content,
        timestamp: Date.now(),
      };
      chatMessages.push(chatMessage);

      signale.sentMessage(chatMessage);
      signale.scope("chatMessages").monitor(chatMessages);

      io.to(targetClient.id).emit("chatMessage", chatMessage);
    } else {
      if (process.env.NODE_ENV === "development") {
        signale.error(`target not found: ${target}`);
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

      signale
        .scope("disconnect")
        .info(`Client disconnected: ${disconnectedClient.name} : ${socket.id}`);
      signale.scope("clients").info(clients);
    }
  });
});

const port = 8000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
