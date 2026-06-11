import { Message, KnowledgeCheckStrategy } from "./Message";

export interface ConversationParams {
  retrievalLimit: number;
  retrievalMinScore: number;
  rerankEnabled: boolean;
  rerankModel: string;
  rerankCandidateMultiplier: number;
  llmModel: string;
  llmTemperature: number;
  llmMaxTokens: number;
  knowledgeCheckStrategies: KnowledgeCheckStrategy[];
}

export interface Conversation {
  id: string;
  title: string;
  params: ConversationParams;
  messages: Message[];
  createdAt: Date;
}
