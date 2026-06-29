# Idea: Alternative LLM Providers

Support LLMs other than Anthropic — small models, controlled resources, no uncontrolled external dependencies.

## Options

### 1. Ollama (local, self-hosted)
**Models**: Llama 3.2 3B, Phi-4-mini, Qwen2.5 3B  
**Pro**: zero cost, 100% local data, no network dependency  
**Con**: requires GPU RAM (≥8 GB), lower quality than large models, higher latency

### 2. Mistral API (cloud, pay-per-use)
**Models**: `mistral-small-latest`, `ministral-3b`  
**Pro**: excellent quality/price ratio, EU-based (GDPR), simple API  
**Con**: variable cost, data leaves the infrastructure

### 3. Google Gemini (cloud, free quota)
**Models**: `gemini-2.0-flash-lite`, `gemma-3-4b-it`  
**Pro**: generous free quota, very fast  
**Con**: Google ecosystem, privacy policy to verify

### 4. Groq (cloud, extreme speed)
**Models**: `llama-3.1-8b-instant`, `gemma2-9b-it`  
**Pro**: <200 ms latency, free quota, ideal for real-time RAG  
**Con**: limited model selection, low free quota

### 5. LM Studio / llama.cpp (local, no GPU)
**Models**: quantized GGUF (Q4, Q5)  
**Pro**: runs on CPU, full control, free  
**Con**: slow on CPU, more complex setup

## Recommendation

For a "controlled resources" RAG:
- **With GPU**: Ollama + Llama 3.2 3B or Phi-4-mini
- **Without GPU**: Groq (near-zero cost, very fast)

## Railway Deployment

Railway is CPU-only (no GPU instances). This eliminates local model options (Ollama, llama.cpp) as they would be too slow and expensive at scale.

| Option | Viable on Railway | Notes |
|--------|:-----------------:|-------|
| Ollama (self-hosted) | ❌ | CPU-only → unusably slow |
| Mistral API | ✅ | Best overall: EU, pay-per-use, good quality |
| Groq | ✅ | Best for latency; free quota enough for low traffic |
| Google Gemini | ✅ | Free quota generous, but Google privacy concerns |
| llama.cpp / LM Studio | ❌ | CPU too slow for production |

**Recommendation for Railway**: Groq for low traffic (free quota), Mistral for production (predictable cost, GDPR).

The app should abstract the LLM behind a port interface so the provider can be swapped via environment variable (`LLM_PROVIDER=groq|mistral|anthropic`).
