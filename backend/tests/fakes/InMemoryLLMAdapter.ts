import { LLMPort } from "../../src/domain/ports/LLMPort";

export class InMemoryLLMAdapter implements LLMPort {
  private response: string;

  constructor(response = "This is a test response from the LLM.") {
    this.response = response;
  }

  setResponse(response: string): void {
    this.response = response;
  }

  async stream(
    _prompt: string,
    onToken: (token: string) => void,
  ): Promise<string> {
    const tokens = this.response.split(" ");
    for (const token of tokens) {
      onToken(token + " ");
    }
    return this.response;
  }
}
