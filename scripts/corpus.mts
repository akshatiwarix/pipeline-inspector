import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateCorpus } from "../data/generate";

const corpus = generateCorpus();

const outPath = fileURLToPath(new URL("../data/corpus.json", import.meta.url));
writeFileSync(outPath, JSON.stringify(corpus, null, 2) + "\n");

const byProfile = (profile: string) => corpus.opportunities.filter((o) => o.outcomeProfile === profile).length;

console.log(`opportunities: ${corpus.opportunities.length}`);
console.log(`healthy: ${byProfile("healthy")}`);
console.log(`stalling: ${byProfile("stalling")}`);
console.log(`at-risk: ${byProfile("at-risk")}`);
console.log(`wrote ${outPath}`);
