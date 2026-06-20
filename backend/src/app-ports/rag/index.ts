export * from "./IAskQuestion";
export * from "./ICheckResponseGrounding";
export * from "./IConversationService";
export * from "./IConversationTitleGenerator";
export * from "./IRetrieveKnowledge";
export * from "./ISourceCitationResolver";

import type { IAskQuestion } from "./IAskQuestion";
import type { IConversationTitleGenerator } from "./IConversationTitleGenerator";
import type { IRetrieveKnowledge } from "./IRetrieveKnowledge";
import type { ISourceCitationResolver } from "./ISourceCitationResolver";

export interface ArgosRag {
  askQuestion: IAskQuestion;
  conversationTitleGenerator: IConversationTitleGenerator;
  retrieveKnowledge: IRetrieveKnowledge;
  sourceCitationResolver: ISourceCitationResolver;
}
