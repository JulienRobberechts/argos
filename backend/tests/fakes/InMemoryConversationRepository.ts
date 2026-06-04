import { Conversation } from "../../src/domain/entities/Conversation";
import { Message } from "../../src/domain/entities/Message";
import { ConversationRepository } from "../../src/domain/ports/ConversationRepository";

export class InMemoryConversationRepository implements ConversationRepository {
  private conversations: Map<string, Conversation> = new Map();

  async save(conversation: Conversation): Promise<void> {
    this.conversations.set(conversation.id, {
      ...conversation,
      messages: [...conversation.messages],
    });
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) ?? null;
  }

  async findAll(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  async addMessage(conversationId: string, message: Message): Promise<void> {
    const conv = this.conversations.get(conversationId);
    if (conv) {
      this.conversations.set(conversationId, {
        ...conv,
        messages: [...conv.messages, message],
      });
    }
  }

  async delete(id: string): Promise<void> {
    this.conversations.delete(id);
  }

  clear(): void {
    this.conversations.clear();
  }
}
