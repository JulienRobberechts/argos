import type { IConversationService } from "../../app-ports/rag/IConversationService";
import type { Conversation, ConversationSummary } from "../../domain/entities/Conversation";
import type { IConversationRepository } from "../../infra-ports/persistence/IConversationRepository";

export class ConversationService implements IConversationService {
  constructor(private readonly repo: IConversationRepository) {}

  save(conversation: Conversation): Promise<void> {
    return this.repo.save(conversation);
  }

  findAll(): Promise<ConversationSummary[]> {
    return this.repo.findAll();
  }

  findById(id: string): Promise<Conversation | null> {
    return this.repo.findById(id);
  }

  updateTitle(id: string, title: string): Promise<void> {
    return this.repo.updateTitle(id, title);
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
