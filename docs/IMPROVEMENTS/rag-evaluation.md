# Evaluating a RAG System

## The Problem

RAG systems fail silently. A pipeline can look perfectly healthy — no errors, fast responses, plausible-sounding answers — while consistently producing hallucinations, ignoring key retrieved chunks, or retrieving the wrong documents entirely. Unit tests and type safety cannot catch this class of failure because it lives in the *semantic quality* of the output, not its structure.

The core question is: **how do you know your RAG is actually working?**

Three distinct failure modes exist, each invisible to the others:

| Failure mode | What happens | Not caught by |
|---|---|---|
| **Hallucination** | LLM generates facts not present in retrieved chunks | Retrieval metrics |
| **Poor retrieval** | Relevant chunks never reach the LLM | Generation metrics |
| **Answer drift** | Chunks are retrieved, LLM reads them, but answers a different question | Faithfulness alone |

An evaluation suite must cover all three independently.

---

## The Three Standard Metrics

### 1. Faithfulness

**What it measures**: does the generated answer contain only claims that are explicitly supported by the retrieved chunks?

```
Faithfulness = supported claims / total claims in the answer
```

**How it works** (LLM-as-judge):
1. Extract every factual claim from the answer as atomic statements.
2. For each claim, check whether it can be directly inferred from the retrieved chunks.
3. Score = proportion of supported claims.

```
Question:    "Who created the Orient-Express?"
Answer:      "The Orient-Express was created by Georges Nagelmackers in 1883."
Chunks:      [...contain "Nagelmackers" and "1883"...]

Claims:      ["Created by Nagelmackers" → SUPPORTED, "in 1883" → SUPPORTED]
Score:       1.0
```

A faithfulness score below 1.0 means the LLM introduced information from its training weights rather than the documents. This is the exact failure mode described in `detect-training-vs-context-knowledge.md`.

**Existing implementation**: `src/application/responseChecks/strategies/faithfulness.ts` — already in production, reusable for offline eval.

---

### 2. Answer Relevance

**What it measures**: does the answer actually respond to the question that was asked?

```
AnswerRelevance = cosine_similarity(original_question, regenerated_question)
```

**How it works** (embedding-based):
1. Ask the LLM: *"What question does this answer respond to?"*
2. Embed both the original question and the regenerated question.
3. Cosine similarity between the two vectors = relevance score.

```
Original question:    "What caused the end of the Direct Orient-Express service?"
Answer:               "The Orient-Express ran at barely 55 km/h at the end."
Regenerated question: "How fast was the Orient-Express?"

Similarity: ~0.40  →  low relevance, the answer is off-topic
```

This metric catches cases where the LLM answers *something* related but not the actual question — common when the retrieved chunks are broadly relevant but do not contain the precise information sought.

**Implementation**: `VoyageEmbeddingAdapter` provides `embed()` — use directly.

---

### 3. Context Recall

**What it measures**: do the retrieved chunks contain the information needed to answer correctly?

```
ContextRecall = claims from expected_answer covered by chunks / total claims
```

**How it works** (LLM-as-judge against a reference answer):
1. Decompose the reference (`expected_answer`) into atomic claims.
2. For each claim, check whether at least one retrieved chunk supports it.
3. Score = proportion of claims covered.

```
Expected answer:  "Service ended in 1977 due to competition from mass aviation."
Claims:           ["ended in 1977" → IN chunk #3, "aviation competition" → IN chunk #1]
Score:            1.0  →  retrieval was complete
```

A low context recall score means the retrieval step failed — the right documents were in the knowledge base but were not surfaced. This points to chunking, embedding quality, or min-score threshold issues, not to LLM problems.

**Note**: this metric requires a reference answer (`expected_answer` in `dataset.json`). It cannot be computed without a labeled dataset.

---

## The Evaluation Dataset

A labeled dataset is the foundation of reproducible evaluation. Without it, you can only measure proxy signals.

### Structure

```json
{
  "id": "oe-01",
  "dataset": "orient-express",
  "difficulty": "easy",
  "question": "Who founded the Compagnie Internationale des Wagons-Lits?",
  "expected_answer": "Georges Nagelmackers, a Belgian engineer, founded the CIWL in 1876.",
  "document_ids": ["Orient-Express/orient-express.md"]
}
```

### Dataset design principles

**Cover multiple difficulty levels.** Easy questions test basic retrieval (exact keyword match). Hard questions require multi-chunk synthesis — they expose failures in chunking strategy and retrieval breadth.

**Use two distinct corpora.** This project uses Orient-Express (real historical content) and Val-en-Selve (fictional city). The fictional corpus is especially valuable: the LLM has zero parametric knowledge of it, so any correct answer *must* come from the retrieved chunks. A faithfulness failure on Val-en-Selve is unambiguous.

**Include cross-document questions.** Some questions require information from two or more source files (`document_ids` with multiple entries). These stress-test context assembly and chunk ranking.

**Avoid overlap with LLM training data.** Questions about well-known facts (Napoleon's birth year) will score well regardless of retrieval quality — the LLM answers from memory. Prefer specific, obscure, or fictional facts.

---

## Risks and Pitfalls

### 1. LLM judge self-grading bias

When the same model generates the answer *and* judges it, it tends to rate its own output favorably — even when that output is wrong. The faithfulness prompt in this project uses a separate, low-temperature call, which partially mitigates this, but the underlying model remains Claude in both roles.

**Mitigation**: use a weaker, cheaper model for generation (Haiku) and a stronger model for judging (Sonnet). Different temperatures also help (0.1 for generation, 0 for judging).

---

### 2. Cost per evaluation run

Each question in the dataset requires:
- 1 embedding call (query) → Voyage AI
- 1 RAG pipeline call → Voyage AI + PgVector + Voyage reranker
- 1 LLM call (answer generation) → Anthropic
- 1 LLM call (faithfulness) → Anthropic
- 2 LLM calls + 2 embedding calls (answer relevance, context recall) → Anthropic + Voyage

A 14-question dataset costs approximately 7–8 LLM calls × 14 = ~100 API calls per run. At Haiku pricing this is negligible, but it rules out running eval on every commit.

**Mitigation**: `workflow_dispatch` in CI (manual trigger), not `on: push`.

---

### 3. Dataset leakage

If the eval dataset questions are derived from the same documents that are ingested into the knowledge base, the system is tested on its own training data. This is not leakage in the ML sense — RAG systems are *supposed* to retrieve from their corpus — but it means the dataset validates *coverage*, not *generalization*.

**This is intentional for a demo RAG.** The goal is to confirm the pipeline retrieves and answers correctly from known documents. Generalization testing requires a held-out document set.

---

### 4. Metric gaming

Maximizing faithfulness can hurt answer quality. A system that returns *only* the retrieved chunk verbatim scores 1.0 on faithfulness but 0.0 on usefulness. The three metrics must be read together.

**Watch for**: faithfulness ↑, answer relevance ↓ → the LLM is parroting chunks without addressing the question.

---

### 5. Chunk boundary sensitivity

Context recall is sensitive to how the document is chunked. The same information can be split across two chunks, with each half below the similarity threshold. A context recall of 0.6 may indicate chunking issues rather than retrieval failure.

**Mitigation**: run eval after changing chunking parameters and compare deltas. The project's `ChunkingStrategies.cases.ts` already supports this kind of regression tracking.

---

### 6. Reference answer quality

Context recall is only as good as the `expected_answer`. If the reference is incomplete or uses different phrasing than the source, the metric will underestimate actual recall.

**Rule of thumb**: write `expected_answer` by reading the source document, not by asking the LLM.

---

## Running Evaluation

### Pipeline

```
dataset.json
    ↓
for each question:
    SearchKnowledge.execute(question)     → chunks
    llm.stream(buildPrompt(q, chunks))    → rag_answer
    scoreFaithfulness(q, rag_answer, chunks)
    scoreAnswerRelevance(q, rag_answer)
    scoreContextRecall(q, expected_answer, chunks)
    ↓
print results table
```

Use `SearchKnowledge` directly, not `AskQuestion` — the latter writes to the conversation database and generates titles, neither of which is needed for offline eval.

### Environment variables required

```
ANTHROPIC_API_KEY
VOYAGE_API_KEY
DATABASE_URL        (documents must already be ingested)
```

### Interpreting results

| Score range | Signal |
|---|---|
| Faithfulness < 0.80 | LLM is hallucinating — check retrieval quality and prompt |
| Answer Relevance < 0.70 | Chunks are off-topic — check chunking size and embedding model |
| Context Recall < 0.70 | Retrieval is incomplete — lower min-score, increase retrieval limit, or use hybrid search |
| All three low | End-to-end failure — check ingestion and embedding pipeline |

---

## Relationship to Online Monitoring

Offline evaluation (this page) uses a labeled dataset and runs as a batch job. It gives precise, reproducible scores but requires human-labeled ground truth and produces results after the fact.

Online monitoring observes live traffic in production:
- Log faithfulness scores on every request (already implemented in this project via `knowledgeCheck` on `Message`)
- Alert when the rolling average drops below threshold
- Track which questions produce low-recall retrievals

The two are complementary. Offline eval validates that the pipeline works for known questions. Online monitoring catches degradations introduced by new documents, model updates, or traffic pattern shifts.

---

## Sources

- [RAGAS: Automated Evaluation of RAG Pipelines (2023)](https://arxiv.org/pdf/2309.15217)
- [Benchmarking LLM Faithfulness in RAG with a Focus on Precision (2025)](https://arxiv.org/abs/2505.04847)
- [ARES: An Automated Evaluation Framework for RAG Systems (2023)](https://arxiv.org/abs/2311.09476)
- [Faithfulness metric — Ragas docs](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/)
- [Answer Relevance metric — Ragas docs](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/answer_relevance/)
- [Context Recall metric — Ragas docs](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_recall/)
