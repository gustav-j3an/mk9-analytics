import { canonicalize } from '@/modules/shared/normalization';

const IGNORED = new Set(['LOJA', 'FILIAL', 'UNIDADE']);
const STATES = new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']);

export function storeTokens(value: string) {
  const tokens = canonicalize(value).split(' ').filter(Boolean);
  return tokens.filter((token, index) =>
    !IGNORED.has(token) && !(index === tokens.length - 1 && STATES.has(token)),
  );
}

export function storeKey(value: string) {
  return storeTokens(value).join(' ');
}

export function inferredChain(value: string) {
  const tokens = storeTokens(value);
  if (tokens[0] === 'DIA' && tokens[1] === 'A' && tokens[2] === 'DIA') return 'DIA A DIA';
  if (tokens[0] === 'FORT' && tokens[1] === 'ATACADISTA') return 'FORT ATACADISTA';
  return tokens[0] ?? '';
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column++) {
      const above = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

export function storeSimilarity(left: string, right: string) {
  const a = storeKey(left);
  const b = storeKey(right);
  if (a === b) return 1;
  if (!a || !b || inferredChain(a) !== inferredChain(b)) return 0;
  const edit = 1 - editDistance(a, b) / Math.max(a.length, b.length);
  const aTokens = new Set(a.split(' '));
  const bTokens = new Set(b.split(' '));
  const common = [...aTokens].filter((token) => bTokens.has(token)).length;
  const dice = (2 * common) / (aTokens.size + bTokens.size);
  const smaller = aTokens.size <= bTokens.size ? aTokens : bTokens;
  const larger = aTokens.size <= bTokens.size ? bTokens : aTokens;
  const isQualifiedSubset = smaller.size >= 2 && [...smaller].every((token) => larger.has(token));
  const score = edit * 0.55 + dice * 0.45;
  return Number(Math.max(score, isQualifiedSubset ? 0.92 : 0).toFixed(4));
}
