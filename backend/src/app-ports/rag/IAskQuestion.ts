import type { Message } from "../../domain/entities/Message";

export interface IAskQuestion {
  execute(
    conversationId: string,
    userContent: string,
    onToken: (token: string) => void,
    signal?: AbortSignal,
  ): Promise<Message>;
}
