import { Socket } from "socket.io";

interface ChatMessage {
  id: string;
  sender: string;
  target: string;
  content: string;
  timestamp: number;
}

interface Client {
  id: string;
  name: string;
  socket: Socket;
}

export { ChatMessage, Client };
