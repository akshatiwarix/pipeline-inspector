import { z } from "zod";
import { OpportunitySchema } from "@/lib/domain/pipeline";
import corpusJson from "./corpus.json";

const CorpusSchema = z.object({
  opportunities: z.array(OpportunitySchema),
});

const corpus = CorpusSchema.parse(corpusJson);

export const OPPORTUNITIES = corpus.opportunities;
