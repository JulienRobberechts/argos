export interface ChunkConfig {
  chunkSize: number;
  chunkOverlap: number;
}

export interface ChunkResult {
  content: string;
  metadata: {
    position: number;
    startChar: number;
    endChar: number;
  };
}

interface Token {
  start: number;
  end: number;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({ start: match.index, end: match.index + match[0].length });
  }
  return tokens;
}

function findBestSplit(
  text: string,
  searchFrom: number,
  maxEnd: number,
): number {
  for (let i = maxEnd - 2; i >= searchFrom; i--) {
    if (text[i] === "\n" && text[i + 1] === "\n") {
      return i + 2;
    }
  }
  for (let i = maxEnd - 1; i >= searchFrom; i--) {
    if (text[i] === "\n") {
      return i + 1;
    }
  }
  for (let i = maxEnd - 2; i >= searchFrom; i--) {
    if (text[i] === "." && /\s/.test(text[i + 1])) {
      return i + 2;
    }
  }
  for (let i = maxEnd - 1; i >= searchFrom; i--) {
    if (/\s/.test(text[i])) {
      return i + 1;
    }
  }
  return maxEnd;
}

export class ChunkingStrategy {
  chunk(text: string, config: ChunkConfig): ChunkResult[] {
    const { chunkSize, chunkOverlap } = config;
    const tokens = tokenize(text);

    if (tokens.length === 0) return [];

    if (tokens.length <= chunkSize) {
      return [
        {
          content: text.trim(),
          metadata: { position: 0, startChar: 0, endChar: text.length },
        },
      ];
    }

    const results: ChunkResult[] = [];
    let tokenStart = 0;

    while (tokenStart < tokens.length) {
      const tokenEnd = Math.min(tokenStart + chunkSize, tokens.length);
      const charStart = tokens[tokenStart].start;
      const maxCharEnd = tokens[tokenEnd - 1].end;

      let charEnd: number;
      let lastTokenInChunk: number;

      if (tokenEnd >= tokens.length) {
        charEnd = text.length;
        lastTokenInChunk = tokenEnd - 1;
      } else {
        const searchFrom = Math.floor(
          charStart + (maxCharEnd - charStart) * 0.5,
        );
        charEnd = findBestSplit(text, searchFrom, maxCharEnd);

        lastTokenInChunk = tokenEnd - 1;
        while (
          lastTokenInChunk > tokenStart &&
          tokens[lastTokenInChunk].start >= charEnd
        ) {
          lastTokenInChunk--;
        }
      }

      const content = text.slice(charStart, charEnd).trim();
      if (content.length > 0) {
        results.push({
          content,
          metadata: {
            position: results.length,
            startChar: charStart,
            endChar: charEnd,
          },
        });
      }

      const nextTokenStart = Math.max(
        lastTokenInChunk - chunkOverlap + 1,
        tokenStart + 1,
      );
      tokenStart = nextTokenStart;
    }

    return results;
  }
}
