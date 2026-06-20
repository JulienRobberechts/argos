# [TECH DEBT] AppSettingsService imports concrete config

**Affected layer:** `app/admin/AppSettingsService.ts`

## Problem

`AppSettingsService` directly imports the `config` singleton (line 9):

```typescript
import config from "../../config";
```

`config.ts` reads `process.env` and calls `dotenv.config()` — that is infrastructure. The `app` layer must not depend on it.

The service uses `config` for two things:
1. Checking API key availability (`config.embeddings.voyage.apiKey`)
2. Providing fallback values for chunking and storage

## Impact

- Tests for `AppSettingsService` require real environment variables
- The `app` / infra boundary is invisible: you cannot tell without reading the code that this service depends on the environment
- Substituting the configuration (e.g. tests with a different config) is impossible without patching `process.env`

## Expected fix

Inject the required config values via the constructor:

```typescript
export class AppSettingsService implements IAppSettingsService {
  constructor(
    private readonly repo: IAppSettingsRepository,
    private readonly defaultConfig: AppSettingsDefaults,
  ) {}
}
```

Or define an `IAppConfigPort` if multiple services need it.
`registry.ts` injects values read from `config` at construction time.
