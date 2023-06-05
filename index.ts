import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { ChatMessage, Client } from "./types";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const clients: Client[] = [];
const chatMessages: ChatMessage[] = [];

io.on("connection", (socket: Socket) => {
  console.log("A user connected.");

  // Register the client and store its information
  socket.on("register", (data: Client) => {
    if (!data.name) {
      socket.disconnect();
      return;
    }
    const client: Client = {
      id: socket.id,
      name: data.name,
      socket,
    };
    clients.push(client);

    if (process.env.NODE_ENV === "development") {
      io.send(`client registered: ${data.name}`);
    }
  });

  socket.on("chatMessage", ({ target, content }: ChatMessage) => {
    const sender =
      clients.find((client) => client.id === socket.id)?.name || "Unknown";
    const from = clients.find((client) => client.name === target);

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
        io.send(`sent chatMessage`, chatMessage);
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        io.send(`target not found: ${target}`);
      }
    }

    /////////
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
