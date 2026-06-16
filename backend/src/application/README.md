# application

Use cases orchestrant le `domain` via les ports, sans détail d'implémentation infra.

- `AskQuestion`, `SearchKnowledge`, `IngestDocument`, `CreateDocument`, `SummarizeDocument`, `GenerateQuiz`
- `AppSettingsService`, `CheckStorageConsistency`, `ResetAll`
- `responseChecks/` — vérifications de réponses LLM (`CheckContextualKnowledge` + stratégies : `citationForcing`, `counterfactual`, `extractJSON`, `faithfulness`)

Appelé par `../api`, dépend des ports définis dans `../domain/ports` (implémentés par `../infrastructure`).
