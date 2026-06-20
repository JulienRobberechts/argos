import type { Conversation, ConversationSummary } from "../../domain/entities";

export interface IConversationService {
  /** Persists a new conversation. */
  save(conversation: Conversation): Promise<void>;
  /** Lists summaries of all conversations. */
  findAll(): Promise<ConversationSummary[]>;
  /** Retrieves a full conversation by id. */
  findById(id: string): Promise<Conversation | null>;
  /** Updates the title of a conversation. */
  updateTitle(id: string, title: string): Promise<void>;
  /** Deletes a conversation. */
  delete(id: string): Promise<void>;
}
