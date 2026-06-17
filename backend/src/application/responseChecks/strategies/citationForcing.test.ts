import { describe, expect, it } from "vitest";
import { parseCitationForcingResult } from "./citationForcing";
import type { ChunkSearchResult } from "../../../domain/ports/IChunkRepository";
import type { Chunk } from "../../../domain/entities/Chunk";
import { randomUUID } from "node:crypto";

function makeChunkResult(content: string): ChunkSearchResult {
  const chunk: Chunk = {
    id: randomUUID(),
    documentId: "doc-1",
    content,
    embedding: [],
    metadata: { position: 0, startChar: 0, endChar: content.length },
  };
  return { chunk, score: 0.9 };
}

describe("parseCitationForcingResult", () => {
  it("parse claims avec marker avant le point [SOURCE N].", () => {
    const raw =
      "L'Orient Express a été créé en 1883 [SOURCE 1]. Il est connu pour son luxe [SOURCE 2].";
    const chunks = [makeChunkResult("fondé en 1883"), makeChunkResult("train luxueux")];

    const { cleanContent, result } = parseCitationForcingResult(raw, chunks);

    expect(result.claims).toHaveLength(2);
    expect(result.claims[0].claim).toBe("L'Orient Express a été créé en 1883");
    expect(result.claims[0].status).toBe("SUPPORTED");
    expect(result.claims[1].claim).toBe("Il est connu pour son luxe");
    expect(result.claims[1].status).toBe("SUPPORTED");
    expect(cleanContent).not.toContain("[SOURCE");
    expect(result.score).toBe(1);
  });

  it("parse claims avec marker après le point. [SOURCE N]", () => {
    const raw =
      "L'Orient Express a été créé en 1883. [SOURCE 1] Il est connu pour son luxe. [SOURCE 2]";
    const chunks = [makeChunkResult("fondé en 1883"), makeChunkResult("train luxueux")];

    const { result } = parseCitationForcingResult(raw, chunks);

    expect(result.claims).toHaveLength(2);
    expect(result.claims[0].claim).toBe("L'Orient Express a été créé en 1883");
    expect(result.claims[0].status).toBe("SUPPORTED");
    expect(result.claims[1].claim).toBe("Il est connu pour son luxe");
    expect(result.claims[1].status).toBe("SUPPORTED");
    expect(result.score).toBe(1);
  });

  it("parse claims OWN KNOWLEDGE", () => {
    const raw = "L'Orient Express est unique [OWN KNOWLEDGE].";

    const { result } = parseCitationForcingResult(raw, []);

    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].claim).toBe("L'Orient Express est unique");
    expect(result.claims[0].status).toBe("UNSUPPORTED");
    expect(result.score).toBe(0);
    expect(result.warning).toBeDefined();
  });

  it("parse un mélange SOURCE et OWN KNOWLEDGE dans la même réponse", () => {
    const raw = "Fondé en 1883. [SOURCE 1] Luxueux. [OWN KNOWLEDGE] Actif aujourd'hui [SOURCE 2].";
    const chunks = [makeChunkResult("fondé en 1883"), makeChunkResult("toujours actif")];

    const { result } = parseCitationForcingResult(raw, chunks);

    expect(result.claims).toHaveLength(3);
    expect(result.claims.find((c) => c.status === "UNSUPPORTED")?.claim).toBe("Luxueux");
    expect(result.score).toBe(2 / 3);
  });

  it("parse claims dans une liste markdown", () => {
    const raw =
      "- L'Orient Express a été créé en 1883 [SOURCE 1]\n- Il est connu pour son luxe [SOURCE 2]";
    const chunks = [makeChunkResult("fondé en 1883"), makeChunkResult("train luxueux")];

    const { result } = parseCitationForcingResult(raw, chunks);

    expect(result.claims).toHaveLength(2);
    expect(result.claims[0].status).toBe("SUPPORTED");
    expect(result.claims[1].status).toBe("SUPPORTED");
  });

  it("retourne score 1 sans warning quand pas de claims", () => {
    const { result } = parseCitationForcingResult("Aucun marqueur ici.", []);

    expect(result.claims).toHaveLength(0);
    expect(result.score).toBe(1);
    expect(result.warning).toBeUndefined();
  });

  it("associe correctement le documentId depuis le chunk indexé", () => {
    const raw = "Fait important [SOURCE 1].";
    const chunk = makeChunkResult("contenu source");
    const titleById = new Map([["doc-1", "Mon Document"]]);

    const { result } = parseCitationForcingResult(raw, [chunk], titleById);

    expect(result.claims[0].documentId).toBe("doc-1");
    expect(result.claims[0].documentTitle).toBe("Mon Document");
  });

  it("gère un SOURCE N hors plage — claim SUPPORTED sans documentId", () => {
    const raw = "Fait important [SOURCE 5].";
    const chunks = [makeChunkResult("un seul chunk")];

    const { result } = parseCitationForcingResult(raw, chunks);

    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].status).toBe("SUPPORTED");
    expect(result.claims[0].documentId).toBeUndefined();
  });

  it("nettoie tous les marqueurs du contenu affiché", () => {
    const raw = "Fait A [SOURCE 1]. Fait B [OWN KNOWLEDGE].";
    const chunks = [makeChunkResult("fait A")];

    const { cleanContent } = parseCitationForcingResult(raw, chunks);

    expect(cleanContent).not.toContain("[SOURCE");
    expect(cleanContent).not.toContain("[OWN KNOWLEDGE]");
    expect(cleanContent).toContain("Fait A");
    expect(cleanContent).toContain("Fait B");
  });
});
