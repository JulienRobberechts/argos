# Problèmes identifiés — Chunks & Références

Analyse basée sur `ex1-nationnalité.md` et `ex2-route simplon.md` vs `orient-express.md` + `chunks_export.csv`.

---

## 1. Le chunk pertinent n'est PAS récupéré (Ex1)

**Question** : nationalités des voyageurs.

**Phrase clé dans le document** :
> « Les voyageurs de l'Orient-Express sont essentiellement occidentaux, c'est-à-dire belges, français, anglais, allemands et autrichiens. »

Cette phrase n'apparaît dans **aucun** des 8 chunks retournés. Pourtant, l'IA donne la bonne réponse — elle l'a probablement puisée dans ses données d'entraînement, pas dans les sources RAG affichées.

**Risque** : l'interface affiche des chunks comme "sources" alors qu'ils n'ont pas servi à construire la réponse. Fausse transparence.

---

## 2. ~~Chunks trop courts~~ — l'affichage est tronqué, pas les chunks

**Corrigé** : les chunks en base font **3000–3500 chars** (contenu complet). La mention "Taille : 200 chars" dans l'interface est trompeuse : c'est la taille de l'*extrait affiché*, pas du chunk réel.

La troncature est faite dans `backend/src/application/AskQuestion.ts:129` :
```ts
excerpt: result.chunk.content.slice(0, 200),
```

Le LLM reçoit bien le chunk complet pour générer la réponse. Seul l'affichage utilisateur est limité à 200 chars.

**Problème résiduel** : le label "Taille : 200 chars" induit l'utilisateur en erreur — il croit que le chunk source est court alors qu'il est complet. Il faudrait afficher la taille réelle du chunk et indiquer clairement qu'il s'agit d'un extrait.

---

## 3. Chunks bibliographiques récupérés comme sources

Plusieurs chunks retournés sont des **références bibliographiques**, pas du contenu informatif :

- **Ex1, Chunk 7** : `Orient-Express — Blanche El Gammal. Référence électronique : Blanche El Gammal, Orient-Express. Publictionnaire…`
- **Ex2, Chunk 3** : `Sherwood S., 1984, Venise Simplon Orient-Express. Le plus célèbre train du monde reprend du service, Paris, Payot.`
- **Ex2, Chunks 4 & 5** : listes de références (`Morand P., 1962…`, `Nagelmackers G., 1870…`)

Ces chunks polluent les résultats et font baisser la qualité globale. Ils devraient être filtrés ou exclus de l'index.

---

## 4. Mauvais ranking — chunks non pertinents classés plus haut

En Ex1, les scores les plus élevés vont à des chunks sans rapport avec les nationalités :

| Chunk | Score | Contenu |
|-------|-------|---------|
| Chunk 6 | 0.520 | Madone des Sleepings / littérature |
| Chunk 7 | 0.520 | Référence bibliographique |
| Chunk 1 | 0.589 | Fin de section "all inclusive" → juste avant la phrase clé |
| Chunk 2 | 0.459 | Tunnel du Simplon (hors sujet) |
| Chunk 3 | 0.462 | Londres–Bagdad en 8 jours (hors sujet) |

Le chunk qui **contient réellement** l'information n'est pas récupéré du tout.

---

## 5. Ex2 — seul Chunk 1 est vraiment pertinent

Pour la question sur le Simplon (1906), seul Chunk 1 (score 0.490) contient la réponse. Les 4 autres chunks sont :
- une référence bibliographique (Chunk 3)
- deux listes de références (Chunks 4 & 5)
- un chunk sur le luxe du train sans rapport (Chunk 2)

Le système retourne 5 résultats dont 4 sont du bruit.

---

## Résumé des actions correctives

| Problème | Action |
|----------|--------|
| Affichage tronqué trompeur | Afficher la taille réelle du chunk + label "extrait" |
| Bibliographies indexées | Détecter et exclure les sections de références de l'index |
| Chunks pertinents non récupérés | Revoir la stratégie d'embedding (ex. chunking sémantique par section) |
| Mauvais ranking | Ajouter un re-ranking (cross-encoder) après la recherche vectorielle |
| Transparence des sources | N'afficher que les chunks effectivement utilisés dans la réponse |
