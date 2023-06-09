import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { IChatMessage, Client } from "@/types/types";
import signale from "@/lib/signale";
import { isAuth } from "@/utils/mongodb/isAuth";
import ChatMessage from "@/types/schema/chat-message";
import { dbConnect } from "@/utils/mongodb/mongodb";
import Redis from "ioredis";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const clients: Client[] = [];
const chatMessages: IChatMessage[] = [];

const redis = new Redis({ host: "localhost", port: 6379, db: 0 });
// redis.connect();
// const redisClient = createClient({
//   url: "redis://localhost:6379",
//   legacyMode: true,
// });
// redisClient.connect();

// const redisLpushAsync = promisify(redisClient.lPush).bind(redisClient);
// const redisLrangeAsync = promisify(redisClient.lRange).bind(redisClient);

io.use((socket: Socket, next) => {
  const id = socket.handshake.auth?.id;

  if (!id) {
    signale.error(`Client has not id, disconnected.`);
    return next(new Error("invalid id"));
  }

  return isAuth(id)
    .then((result) => {
      console.log(result);
      const _socket = {
        handshake: socket.handshake,
        socketId: socket.id,
        mongoId: result.id,
        name: result.name,
        userType: result.userType,
      };

      const client: Client = _socket;
      clients.push(client);
      redis.del("clients");
      redis.lpush("clients", JSON.stringify(clients));

      signale.scope("clients").monitor(
        clients.map((client) => {
          return {
            id: client.socketId,
            name: client.name,
          };
        })
      );
      signale.connection(
        `${client.name} : socketId: ${client.socketId}, mongoId: ${client.mongoId}`
      );
      // @ts-ignore
      socket.username = client.name;
      return next();
    })
    .catch((error) => {
      return next(error);
    });
});

io.on("connection", (socket: Socket) => {
  // get latest chatMessages from redis
  const user = clients.find((client) => client.socketId === socket.id);

  (async () => {
    const chats = await redis.keys(`*${user?.mongoId}*`);
    if (chats.length > 0) {
      chats.forEach(async (chat) => {
        const chatMessages = await redis.lrange(chat, 0, -1);
        chatMessages.forEach((chatMessage) => {
          const parsedChatMessage = JSON.parse(chatMessage);
          io.to(socket.id).emit("chatMessage", parsedChatMessage);
        });
      });
    }
  })();

  socket.on("chatMessage", ({ target, content }: IChatMessage) => {
    const sender = clients.find((client) => client.socketId === socket.id);
    const targetClient = clients.find((client) => client.mongoId === target);

    if (targetClient && sender) {
      const chatMessage: IChatMessage = {
        sender: {
          socketId: sender.socketId,
          mongoId: sender.mongoId,
        },
        target: targetClient.mongoId,
        content,
        timestamp: Date.now(),
      };

      chatMessages.push(chatMessage);

      // save private table in redis
      const agent = targetClient.userType === "agent" ? targetClient : sender;
      const company =
        targetClient.userType === "company" ? targetClient : sender;
      const redisKey = `chatMessages:${company.mongoId}-${agent.mongoId}`;
      // redis.rpush("chatMessages", JSON.stringify(chatMessage));
      redis.rpush(redisKey, JSON.stringify(chatMessage));

      // save message in mongodb
      const dbChatMessage: IChatMessage = {
        ...chatMessage,
        sender: sender.mongoId,
      };
      dbConnect()
        .then(() => {
          ChatMessage.create(dbChatMessage).catch((error) => {
            signale.error(error);
          });
        })
        .catch((error) => {
          signale.error(error);
        });

      signale.sentMessage(chatMessage);
      signale.scope("chatMessages").monitor(chatMessages);

      io.to(targetClient.socketId).emit("chatMessage", chatMessage);
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
    const clientIndex = clients.findIndex(
      (client) => client.socketId === socket.id
    );
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
