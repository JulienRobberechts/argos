# ChunkingStrategy — Fonctionnement détaillé

## Vue d'ensemble

Le module expose une interface commune `IChunkingStrategy` et deux implémentations. La factory `createChunkingStrategy(name)` retourne la bonne stratégie selon le nom passé.

```
"recursive" (défaut) → RecursiveChunkingStrategy
"sentence"           → SentenceChunkingStrategy
```

---

## Types partagés (`ChunkingTypes.ts`)

### `ChunkingStrategyName`
```ts
"recursive" | "sentence"
```

### `ChunkConfig`
```ts
{ chunkSize: number; chunkOverlap: number }
```
- **`chunkSize`** : taille maximale en tokens (mots)
- **`chunkOverlap`** : tokens répétés entre deux chunks consécutifs

### `ChunkResult`
```ts
{ content: string; metadata: { position, startChar, endChar } }
```
- **`content`** : texte du chunk (trimmed)
- **`position`** : index dans `results` (chunks vides ignorés)
- **`startChar` / `endChar`** : positions caractères dans le texte original

### `IChunkingStrategy`
```ts
interface IChunkingStrategy {
  chunk(text: string, config: ChunkConfig): ChunkResult[];
}
```

---

## Stratégie 1 : `RecursiveChunkingStrategy`

Découpe basée sur les **tokens** (mots), avec coupure naturelle en caractères.

### Étapes

**1. Tokenisation** — `/\S+/g` → tableau de `{ start, end }` dans le texte original.

**2. Cas trivial** — si `tokens.length ≤ chunkSize` → un seul chunk.

**3. Boucle**
```
step = chunkSize - chunkOverlap
tokenStart = 0

while tokenStart < tokens.length:
    tokenEnd  = min(tokenStart + chunkSize, tokens.length)
    charStart = tokens[tokenStart].start
    maxCharEnd = tokens[tokenEnd-1].end

    if dernier groupe:
        charEnd = text.length
    else:
        searchFrom = charStart + 50% de la fenêtre
        charEnd = findBestSplit(text, searchFrom, maxCharEnd)

    tokenStart += step
```

**4. `findBestSplit`** — cherche en arrière depuis `maxCharEnd` le meilleur point de coupure :

| Priorité | Pattern | Coupure à |
|----------|---------|-----------|
| 1 | `\n\n` | juste après |
| 2 | `\n` | juste après |
| 3 | `. ` (fin de phrase) | juste après le `.` |
| 4 | whitespace | juste après |
| 5 (fallback) | rien | `maxCharEnd` |

### Points d'attention
- Chevauchement calculé en **tokens**, frontière réelle en **caractères** (peut différer légèrement).
- Dernier chunk : `charEnd = text.length`, pas de `findBestSplit`.
- Chunks vides (après trim) ignorés.

---

## Stratégie 2 : `SentenceChunkingStrategy`

Découpe basée sur les **phrases/paragraphes**, respect des frontières sémantiques.

### Segmentation des phrases

Regex `SENTENCE_BOUNDARY` coupe :
- après `[.!?]` suivi de whitespace + majuscule (y compris lettres accentuées et guillemets)
- sur `\n\n+` (rupture de paragraphe)

### Boucle de chunking

Accumule des phrases entières jusqu'à atteindre `chunkSize` tokens. Puis calcule l'overlap **en remontant** depuis la fin du chunk pour inclure les dernières phrases qui tiennent dans `chunkOverlap` tokens.

```
sentenceStart = 0
while sentenceStart < sentences.length:
    accumule phrases → sentenceEnd (jusqu'à dépasser chunkSize)
    émet chunk [sentenceStart..sentenceEnd-1]

    remonte depuis sentenceEnd-1 pour trouver overlapStart
    (phrases dont la somme ≤ chunkOverlap)

    sentenceStart = overlapStart (ou sentenceEnd si pas d'overlap)
```

### Points d'attention
- Si le texte total ≤ `chunkSize` tokens → un seul chunk.
- Une phrase trop longue seule (> `chunkSize`) est quand même émise en chunk unique.
- L'overlap est en **phrases entières** (pas en tokens exacts).
