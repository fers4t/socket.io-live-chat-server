import { ChatMessage } from "./types";

declare module "signale" {
  interface SignaleConstructor {
    new (options?: SignaleOptions): Signale;

    sentMessage(message: ChatMessage): void;
    connection(message: string): void;
    monitor(message: string): void;

    Signale: Signale;
  }
}
