import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(__dirname, "Orient-Express");

export const compagnieInterationaleDesWagonsLits = readFileSync(
  join(dir, "Compagnie internationale des wagons-lits.md"),
  "utf-8",
);

export const reneJulesLalique = readFileSync(join(dir, "René Jules Lalique.md"), "utf-8");

export const reneProu = readFileSync(join(dir, "René Prou.md"), "utf-8");

export const veniseSimplonOrientExpress = readFileSync(
  join(dir, "Venise-Simplon-Orient-Express.md"),
  "utf-8",
);

export const oeWikipedia = readFileSync(join(dir, "oe-wikipedia.md"), "utf-8");

export const orientExpress = readFileSync(join(dir, "orient-express.md"), "utf-8");

export const orientExpressQuestions = readFileSync(
  join(dir, "orient-express.questions.md"),
  "utf-8",
);
