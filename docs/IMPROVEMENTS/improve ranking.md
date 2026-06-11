# Améliorer la qualité du ranking dans le RAG

## Contexte

Le problème observé : pour la question *"Quand a commencé l'Orient-Express ?"*, les chunks retournés ont des scores de similarité cosinus de ~0.37–0.39. Ils ne contiennent pas l'information clé ("1883", "Nagelmackers"). Le LLM génère une réponse correcte en puisant dans ses données d'entraînement plutôt que dans les sources récupérées.

Cause racine : la **recherche vectorielle seule** est insuffisante pour les questions factuelles précises. Le vecteur d'une question (`"Quand a commencé ?"`) et le vecteur d'une réponse factuelle (`"lancé en 1883"`) ne sont pas proches dans l'espace d'embedding.

---

## Approche 1 : Recherche hybride (BM25 + vecteurs)

### Principe

Combiner deux signaux de pertinence :
- **BM25** (lexical) : correspondance exacte de mots-clés — excellent pour les dates, noms propres, chiffres
- **Vecteurs** (sémantique) : correspondance de sens — excellent pour les synonymes, paraphrases

Les scores sont fusionnés via **Reciprocal Rank Fusion (RRF)** ou une somme pondérée.

### Implémentation dans ce projet

PostgreSQL dispose nativement de la recherche full-text via `tsvector` / `tsquery`.

**Migration SQL :**
```sql
ALTER TABLE chunks ADD COLUMN content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('french', content)) STORED;
CREATE INDEX ON chunks USING GIN(content_tsv);
```

**Requête hybride dans `PgVectorChunkRepository.search` :**
```sql
WITH vector_search AS (
  SELECT id, 1 - (embedding <=> $1::vector) AS vec_score
  FROM chunks
  ORDER BY embedding <=> $1::vector
  LIMIT 20
),
bm25_search AS (
  SELECT id, ts_rank(content_tsv, plainto_tsquery('french', $2)) AS bm25_score
  FROM chunks
  WHERE content_tsv @@ plainto_tsquery('french', $2)
  LIMIT 20
),
rrf AS (
  SELECT
    COALESCE(v.id, b.id) AS id,
    COALESCE(1.0 / (60 + ROW_NUMBER() OVER (ORDER BY vec_score DESC)), 0) +
    COALESCE(1.0 / (60 + ROW_NUMBER() OVER (ORDER BY bm25_score DESC)), 0) AS rrf_score
  FROM vector_search v
  FULL OUTER JOIN bm25_search b ON v.id = b.id
)
SELECT c.id, c.document_id, c.content, c.metadata, rrf.rrf_score AS score
FROM rrf JOIN chunks c ON rrf.id = c.id
WHERE rrf.rrf_score >= $3
ORDER BY rrf_score DESC
LIMIT $4
```

### Avantages / Inconvénients

| + | - |
|---|---|
| Capture les correspondances exactes (dates, noms) | Complexifie la requête SQL |
| Pas de dépendance externe | Nécessite une migration |
| Amélioration immédiate et mesurable | BM25 de PostgreSQL moins puissant qu'Elasticsearch |

### Impact attendu

Élevé pour les questions factuelles ("1883", "Nagelmackers") — ces termes apparaissent textuellement dans le document.

---

## Approche 2 : HyDE (Hypothetical Document Embeddings)

### Principe

Au lieu d'embedder la **question**, on demande d'abord au LLM de générer une **réponse hypothétique**, puis on embede cette réponse. L'idée : un chunk de réponse est sémantiquement plus proche d'un autre chunk de réponse que d'une question.

```
Question: "Quand a commencé l'Orient-Express ?"
↓ LLM (sans contexte)
Réponse hypothétique: "L'Orient-Express a commencé à circuler en 1883 sous l'impulsion de Georges Nagelmackers..."
↓ Embedding
→ Recherche vectorielle avec ce vecteur
```

### Implémentation

Dans `SearchKnowledge.ts` :
```typescript
async execute(query: string, limit = 5, minScore = 0.7): Promise<ChunkSearchResult[]> {
  const hypothetical = await this.llmAdapter.complete(
    `Answer this question in 2-3 sentences as if you had the document: "${query}"`
  );
  const vector = await this.embeddingAdapter.embed(hypothetical, "document");
  return this.chunkRepo.search(vector, limit, minScore);
}
```

Nécessite d'ajouter une méthode `complete()` (non-streaming) dans `LLMPort`.

### Avantages / Inconvénients

| + | - |
|---|---|
| Amélioration significative de la similarité sémantique | Ajoute 1 appel LLM par question (+latence, +coût) |
| Fonctionne sans modifier le schéma DB | Risque : la réponse hypothétique peut être biaisée |
| Simple à implémenter | Moins utile quand le LLM n'a pas de connaissances préalables |

### Impact attendu

Moyen-élevé. Fonctionne bien quand le LLM connaît déjà le domaine (histoire, culture générale). Moins utile pour des documents très techniques ou propriétaires.

---

## Approche 3 : Re-ranking avec un cross-encoder

### Principe

La recherche vectorielle retourne des candidats rapidement (k-NN approximate) mais avec une précision limitée. Un **cross-encoder** évalue chaque paire (question, chunk) ensemble — bien plus précis mais plus lent.

Pipeline en deux étapes :
1. **Retrieval** : vecteurs → top-20 candidats (rapide)
2. **Re-ranking** : cross-encoder → top-5 réordonnés (précis)

### Implémentation

Via l'API Voyage AI (qui propose aussi un reranker) ou Cohere Rerank :

```typescript
// Nouveau port
interface RerankerPort {
  rerank(query: string, documents: string[], topN: number): Promise<number[]>; // indices réordonnés
}

// Dans SearchKnowledge
const candidates = await this.chunkRepo.search(vector, 20, 0.3); // seuil bas, large filet
const indices = await this.reranker.rerank(query, candidates.map(c => c.chunk.content), limit);
return indices.map(i => candidates[i]);
```

Voyage AI : `voyage-rerank-2` — même fournisseur que les embeddings, cohérence garantie.

### Avantages / Inconvénients

| + | - |
|---|---|
| Précision nettement supérieure | Dépendance externe (Voyage/Cohere) |
| Combinable avec hybride BM25 | Latence additionnelle (~200ms) |
| Standard de l'industrie pour RAG prod | Coût par appel |

### Impact attendu

Élevé — c'est la solution la plus robuste pour améliorer la pertinence finale. Souvent combinée avec la recherche hybride.

---

## Approche 4 : Réduction de la taille des chunks

### Principe

Avec `chunkSize=512` et `chunkOverlap=128`, un chunk contient ~512 tokens. Un fait précis ("1883") est noyé dans beaucoup d'autre contenu, ce qui dilue le vecteur.

Des chunks plus petits (128–256 tokens) concentrent l'information → vecteur plus représentatif → meilleure similarité.

Variante **"parent-child"** :
- Indexer les petits chunks (128 tokens) pour la recherche
- Retourner le chunk parent (512 tokens) comme contexte au LLM

### Implémentation

Modifier le config via `CHUNK_SIZE_TOKENS` et `CHUNK_OVERLAP_TOKENS` :
```env
CHUNK_SIZE_TOKENS=150
CHUNK_OVERLAP_TOKENS=30
```

Pour le pattern parent-child, ajouter un champ `parentId` dans `Chunk` et modifier `IngestDocument` pour créer deux niveaux.

### Avantages / Inconvénients

| + | - |
|---|---|
| Pas de dépendance externe | Nécessite de ré-indexer tous les documents |
| Améliore la précision des embeddings | Augmente le nombre de chunks (×3-4) |
| Configurable sans code | Le contexte envoyé au LLM est plus fragmenté |

### Impact attendu

Moyen. À tester empiriquement — il existe un fichier `ChunkingStrategies.cases.ts` dans le projet pour cela.

---

## Recommandation

Par ordre d'implémentation :

1. **Hybride BM25 + vecteurs** — gain immédiat, pas de coût supplémentaire, reste dans PostgreSQL
2. **Re-ranking Voyage** — meilleure précision finale, coût marginal
3. **HyDE** — à évaluer selon le domaine des documents
4. **Chunks plus petits** — à tester avec les cas existants dans `ChunkingStrategies.cases.ts`
