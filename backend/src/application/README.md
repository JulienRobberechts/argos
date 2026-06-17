# application

Use cases orchestrant le `domain` via les ports, sans détail d'implémentation infra.

Appelé par `../api`, dépend des ports définis dans `../domain/ports` (implémentés par `../infrastructure`).

---

## Documents

| Classe | Description |
|---|---|
| `CreateDocument` | Upload le fichier brut en storage et persiste l'entrée document en base (statut `pending`, avant ingestion). |
| `IngestDocument` | Parse, découpe en chunks et génère les embeddings d'un document pour le rendre interrogeable. |
| `SummarizeDocument` | Génère un résumé LLM à partir des chunks d'un document et le persiste en base. |

## Recherche & Question

| Classe | Description |
|---|---|
| `SearchKnowledge` | Recherche les chunks les plus pertinents par vecteur ou en mode hybride, avec reranking optionnel. |
| `AskQuestion` | Répond à une question utilisateur via RAG — récupère les chunks pertinents, streame la réponse LLM et applique les vérifications de qualité configurées. |
| `GenerateQuiz` | Génère des questions à choix multiples à partir du contenu de documents via le LLM. |

## Vérification de réponses (`responseChecks/`)

| Classe / Stratégie | Description |
|---|---|
| `CheckResponseGrounding` | Orchestre les stratégies de vérification et agrège leurs résultats. |
| `faithfulness` | Évalue si chaque affirmation de la réponse est ancrée dans les chunks récupérés. |
| `citationForcing` | Force le LLM à citer ses sources inline, puis parse les citations pour scorer l'ancrage. |
| `counterfactual` | Détecte la valeur ajoutée du RAG en comparant la réponse avec et sans contexte. |

## Administration

| Classe | Description |
|---|---|
| `AppSettingsService` | Lit et met à jour la configuration runtime (provider d'embedding, storage, stratégie de chunking) persistée en base. |
| `CheckStorageConsistency` | Détecte les fichiers orphelins (storage sans entrée DB) et les fichiers manquants (entrée DB sans fichier). |
| `ResetAll` | Supprime tous les fichiers du storage et tronque toutes les tables, puis applique les nouveaux paramètres si fournis. |
