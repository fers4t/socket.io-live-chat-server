import { Socket } from "socket.io";

interface ChatMessage {
  sender: string;
  target: string;
  content: string;
  timestamp: number;
  hasSeen?: boolean;
  seenTimestamp?: number;
}

interface Client {
  handshake: Socket["handshake"];
  id: Socket["id"];
  name: string;
}

export { ChatMessage, Client };
