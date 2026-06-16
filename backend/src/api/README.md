# api

Couche d'entrée HTTP. Expose les routes, gère l'auth, la validation et le mapping vers la couche `application`.

- `routes/` — endpoints (auth, documents, search, conversations, quizzes, config, admin)
- `middleware/` — `apiKeyAuth`, `errorHandler`
- `dto/` — objets de transfert (ex: `document.dto.ts`)

Ne contient pas de logique métier : délègue aux use cases de `../application`.
