import type { IAskQuestion } from "./IAskQuestion";
import type { IConversationTitleGenerator } from "./IConversationTitleGenerator";
import type { IRetrieveKnowledge } from "./IRetrieveKnowledge";
import type { ISourceCitationResolver } from "./ISourceCitationResolver";

export type {
  IAskQuestion,
  IConversationTitleGenerator,
  IRetrieveKnowledge,
  ISourceCitationResolver,
};

export interface ArgosRag {
  askQuestion: IAskQuestion;
  conversationTitleGenerator: IConversationTitleGenerator;
  retrieveKnowledge: IRetrieveKnowledge;
  sourceCitationResolver: ISourceCitationResolver;
}
