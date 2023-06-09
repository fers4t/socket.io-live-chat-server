import { Socket } from "socket.io";
import mongoose from "mongoose";

interface IChatMessage {
  sender:
    | mongoose.Schema.Types.ObjectId
    | {
        socketId: string;
        mongoId: mongoose.Schema.Types.ObjectId;
      };
  target: mongoose.Schema.Types.ObjectId;
  content: string;
  timestamp: number;
  hasSeen?: boolean;
  seenTimestamp?: number;
}

interface Client {
  handshake: Socket["handshake"];
  socketId: Socket["id"];
  mongoId: mongoose.Schema.Types.ObjectId;
  name: string;
  userType?: "agent" | "company";
}

export { IChatMessage, Client };
