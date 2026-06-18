import type { ArgosAdmin } from "./admin";
import type { ArgosKnowledgeBase } from "./knowledgeBase";
import type { ArgosQuiz } from "./quiz";
import type { ArgosRag } from "./rag";

export type { ArgosAdmin, ArgosKnowledgeBase, ArgosQuiz, ArgosRag };

export interface Argos {
  admin: ArgosAdmin;
  kb: ArgosKnowledgeBase;
  quiz: ArgosQuiz;
  rag: ArgosRag;
}
