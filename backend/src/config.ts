const config = {
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || "development",
  },
  db: {
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://devknowledge:devknowledge@localhost:5432/devknowledge",
  },
  llm: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS ?? "1024", 10),
  },
  embeddings: {
    apiKey: process.env.VOYAGE_API_KEY ?? "",
  },
  api: {
    key: process.env.API_KEY,
  },
};

export default config;
