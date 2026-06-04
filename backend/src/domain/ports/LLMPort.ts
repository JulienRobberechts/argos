export interface LLMPort {
  stream(prompt: string, onToken: (token: string) => void): Promise<string>;
}
