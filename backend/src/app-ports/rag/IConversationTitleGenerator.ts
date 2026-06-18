export interface IConversationTitleGenerator {
  generate(question: string, answer: string): Promise<string>;
}
