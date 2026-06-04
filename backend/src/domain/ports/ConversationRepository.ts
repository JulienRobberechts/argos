import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";

export interface ConversationRepository {
  save(conversation: Conversation): Promise<void>;
  findById(id: string): Promise<Conversation | null>;
  findAll(): Promise<Conversation[]>;
  addMessage(conversationId: string, message: Message): Promise<void>;
  delete(id: string): Promise<void>;
}
