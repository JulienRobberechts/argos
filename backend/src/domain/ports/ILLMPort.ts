export interface LLMStreamOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ILLMPort {
  stream(
    prompt: string,
    onToken: (token: string) => void,
    signal?: AbortSignal,
    options?: LLMStreamOptions,
  ): Promise<string>;
}
