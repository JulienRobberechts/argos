# ChunkingStrategy — Fonctionnement détaillé

## Vue d'ensemble

`ChunkingStrategy` découpe un texte long en **chunks** (morceaux) de taille contrôlée, avec chevauchement optionnel entre chunks consécutifs. C'est une étape clé dans un pipeline RAG : les chunks sont ensuite vectorisés et indexés pour la recherche sémantique.

---

## Types publics

### `ChunkConfig`
```ts
{ chunkSize: number; chunkOverlap: number }
```
- **`chunkSize`** : nombre maximum de tokens (mots) par chunk
- **`chunkOverlap`** : nombre de tokens répétés entre deux chunks consécutifs (pour éviter de couper un contexte au mauvais endroit)

### `ChunkResult`
```ts
{ content: string; metadata: { position, startChar, endChar } }
```
- **`content`** : texte du chunk (trimmed)
- **`position`** : index du chunk dans la liste résultante
- **`startChar` / `endChar`** : positions caractères dans le texte original (utile pour tracer la source)

---

## Étapes internes

### 1. Tokenisation — `tokenize(text)`

```
"Hello world foo" → [{ start:0, end:5 }, { start:6, end:11 }, { start:12, end:15 }]
```

Parcourt le texte avec la regex `/\S+/g` (séquences non-blanches). Chaque **token = un mot** (ou ponctuation collée). Stocke uniquement les indices de début/fin dans le texte original, pas le mot lui-même.

> Le comptage de taille se fait en **nombre de tokens**, mais les chunks sont extraits par **positions caractères**.

---

### 2. Cas trivial

Si le texte contient ≤ `chunkSize` tokens → un seul chunk couvrant tout le texte. Pas de split nécessaire.

---

### 3. Boucle de chunking

```
step = chunkSize - chunkOverlap
tokenStart = 0

while tokenStart < tokens.length:
    tokenEnd   = min(tokenStart + chunkSize, tokens.length)
    charStart  = tokens[tokenStart].start
    maxCharEnd = tokens[tokenEnd-1].end

    charEnd = findBestSplit(...)   # sauf si on est au dernier groupe
    chunk   = text[charStart:charEnd].trim()
    tokenStart += step
```

- **`step`** : avancement réel entre deux chunks. Si `chunkSize=100` et `chunkOverlap=20`, on avance de 80 tokens à chaque itération → les 20 derniers tokens du chunk N deviennent les 20 premiers du chunk N+1.
- **`charStart`** / **`maxCharEnd`** : bornes caractères correspondant aux tokens de la fenêtre courante.

---

### 4. Recherche du meilleur point de coupure — `findBestSplit(text, searchFrom, maxEnd)`

Au lieu de couper brutalement au dernier caractère du token `tokenEnd-1`, la fonction cherche **en arrière** depuis `maxCharEnd` un point de coupure naturel. La priorité est :

| Priorité | Condition | Coupure à |
|----------|-----------|-----------|
| 1 (meilleure) | `\n\n` (paragraphe) | juste après le `\n\n` |
| 2 | `\n` (saut de ligne) | juste après le `\n` |
| 3 | `. ` (fin de phrase) | juste après le `.` |
| 4 | espace/whitespace | juste après l'espace |
| 5 (fallback) | rien trouvé | `maxCharEnd` (coupure dure) |

La recherche commence à `searchFrom = charStart + 50% de la fenêtre` pour garantir que le chunk fait au moins la moitié de sa taille cible avant de chercher une coupure.

> **Effet** : les chunks sont de taille variable en caractères, mais bornés en tokens. La coupure respecte la structure du document (paragraphes > lignes > phrases > mots).

---

## Exemple visuel

```
chunkSize=5, chunkOverlap=1, step=4

Tokens: [t0 t1 t2 t3 t4 t5 t6 t7 t8]

Chunk 0: tokens 0-4  (t0..t4)
Chunk 1: tokens 4-8  (t4..t8)  ← t4 répété
Chunk 2: tokens 8-8  (t8)
```

---

## Points d'attention

- **Overlap en tokens, coupure en caractères** : le chevauchement est calculé sur les tokens, mais la frontière réelle du chunk peut être légèrement différente à cause de `findBestSplit`.
- **Dernier chunk** : `charEnd = text.length` (pas de `findBestSplit`), donc il prend tout ce qui reste.
- **Chunks vides ignorés** : si `content.trim()` est vide après le slice, le chunk n'est pas ajouté.
- **`position`** dans les métadonnées = index dans `results`, pas `tokenStart` — il reflète l'ordre réel des chunks non-vides.
