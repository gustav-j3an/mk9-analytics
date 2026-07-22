import { canonicalize } from '@/modules/shared/normalization';

export interface IndustryResolutionCandidate {
  id: string;
  code: string;
  name: string;
  aliases?: string[];
}

export class IndustryAliasResolver {
  static resolve(name: string, candidates: IndustryResolutionCandidate[]) {
    const key = canonicalize(name);
    const matches = candidates.filter((candidate) =>
      [candidate.code, candidate.name, ...(candidate.aliases ?? [])].map(canonicalize).includes(key),
    );
    if (matches.length !== 1) return matches.length > 1 ? { id: '', confidence: 0, ambiguous: true } : null;
    return { id: matches[0].id, confidence: canonicalize(matches[0].code) === key ? 100 : 95 };
  }
}
