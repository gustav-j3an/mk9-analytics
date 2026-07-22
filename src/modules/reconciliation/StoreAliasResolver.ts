import { canonicalize } from '@/modules/shared/normalization';
import { inferredChain, storeKey, storeSimilarity } from './store-similarity';

export interface StoreResolutionCandidate {
  id: string;
  code: string;
  name: string;
  state?: string | null;
  city?: string | null;
  aliases?: string[];
}

export class StoreAliasResolver {
  static resolve(name: string, candidates: StoreResolutionCandidate[], state?: string, city?: string) {
    const key = storeKey(name);
    const compatible = candidates.filter((candidate) => {
      const names = [candidate.code, candidate.name, ...(candidate.aliases ?? [])].map(canonicalize);
      if (state && candidate.state && canonicalize(state) !== canonicalize(candidate.state)) return false;
      if (city && candidate.city && canonicalize(city) !== canonicalize(candidate.city)) return false;
      return names.some((candidateName) => inferredChain(candidateName) === inferredChain(key));
    });
    const ranked = compatible.map((candidate) => ({
      candidate,
      score: Math.max(...[candidate.code, candidate.name, ...(candidate.aliases ?? [])].map((value) => storeSimilarity(key, value))),
    })).sort((left, right) => right.score - left.score);
    if (!ranked.length || ranked[0].score < 0.84) return null;
    if (ranked[1] && ranked[0].score - ranked[1].score < 0.12) {
      return { id: '', confidence: Math.round(ranked[0].score * 100), ambiguous: true };
    }
    return { id: ranked[0].candidate.id, confidence: Math.round(ranked[0].score * 100) };
  }
}
