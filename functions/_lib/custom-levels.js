import {
  CUSTOM_LEVEL_CATALOG,
  CUSTOM_LEVEL_CATALOG_CHECKSUM,
  CUSTOM_LEVEL_DICTIONARY_VERSION,
} from '../_generated/custom-level-catalog.js';

export class CustomLevelValidationError extends Error {}
export class CustomLevelWordCheckError extends Error {}

async function dictionaryApiHasWord(word, fetcher) {
  const response = await fetcher(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
    headers: { accept: 'application/json' },
  });
  if (response.ok) {
    const entries = await response.json();
    return Array.isArray(entries) && entries.length > 0;
  }
  if (response.status === 404) return false;
  throw new Error('dictionary-service-error');
}

async function datamuseHasWord(word, fetcher) {
  const response = await fetcher(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=10`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error('dictionary-service-error');
  const entries = await response.json();
  return Array.isArray(entries) && entries.some((entry) =>
    entry && String(entry.word || '').toLowerCase() === word && Array.isArray(entry.defs) && entry.defs.length > 0);
}

export async function verifyEnglishWords(words, fetcher = fetch) {
  const uniqueWords = [...new Set(words)];
  const results = await Promise.all(uniqueWords.map(async (word) => {
    try {
      if (await dictionaryApiHasWord(word, fetcher)) return true;
    } catch { /* fall through to the second dictionary provider */ }
    try {
      return await datamuseHasWord(word, fetcher);
    } catch {
      throw new CustomLevelWordCheckError('The dictionary service is temporarily unavailable.');
    }
  }));
  const invalidIndex = results.findIndex((valid) => !valid);
  if (invalidIndex >= 0) {
    throw new CustomLevelValidationError(`Not a verified English word: ${uniqueWords[invalidIndex]}.`);
  }
  return true;
}

function safeText(value, maxLength, label, required = false) {
  const result = typeof value === 'string' ? value.trim() : '';
  const length = Array.from(result).length;
  if ((required && length === 0) || length > maxLength || /[<>\u0000-\u001f\u007f]/.test(result)) {
    throw new CustomLevelValidationError(`Invalid ${label}.`);
  }
  return result;
}

function normalizeRoute(value, startWord) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 12) {
    throw new CustomLevelValidationError('A completed test route is required.');
  }
  const route = value.map((word) => typeof word === 'string' ? word.trim().toLowerCase() : '');
  if (route.some((word) => !/^[a-z]{3,45}$/.test(word)) || route[0] !== startWord || new Set(route).size !== route.length) {
    throw new CustomLevelValidationError('Invalid test route.');
  }
  for (let index = 1; index < route.length; index++) {
    if (!route[index].startsWith(route[index - 1].slice(-2))) {
      throw new CustomLevelValidationError('The test route contains a broken link.');
    }
  }
  if (route[route.length - 1].slice(-2) !== startWord.slice(0, 2)) {
    throw new CustomLevelValidationError('The test route does not close the loop.');
  }
  return route;
}

export function catalogEntry(startWord, difficulty) {
  const packed = CUSTOM_LEVEL_CATALOG[`${difficulty}:${startWord}`];
  if (!packed) return null;
  return {
    target: packed[0], shortestMoves: packed[1], challengeMoves: packed[2], routeCount: packed[3],
    branchWordCount: packed[4], qualityCloserCount: packed[5], maxMoves: packed[6], hintLimit: packed[7],
    computedRoute: packed[8], dictionaryVersion: CUSTOM_LEVEL_DICTIONARY_VERSION,
    catalogChecksum: CUSTOM_LEVEL_CATALOG_CHECKSUM,
  };
}

export function validateCustomLevelSubmission(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CustomLevelValidationError('Invalid custom level body.');
  }
  const startWord = typeof value.startWord === 'string' ? value.startWord.trim().toLowerCase() : '';
  const difficulty = typeof value.difficulty === 'string' ? value.difficulty.trim() : '';
  if (!/^[a-z]{3,45}$/.test(startWord) || !['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new CustomLevelValidationError('Invalid starting word or difficulty.');
  }
  const submittedRoute = normalizeRoute(value.submittedRoute, startWord);
  const slack = difficulty === 'hard' ? 4 : 3;
  const hintLimit = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;
  const computed = catalogEntry(startWord, difficulty) || {
    target: startWord.slice(0, 2),
    shortestMoves: submittedRoute.length - 1,
    challengeMoves: submittedRoute.length - 1,
    routeCount: 1,
    branchWordCount: 0,
    qualityCloserCount: 0,
    maxMoves: submittedRoute.length - 1 + slack,
    hintLimit,
    computedRoute: submittedRoute,
    dictionaryVersion: CUSTOM_LEVEL_DICTIONARY_VERSION,
    catalogChecksum: CUSTOM_LEVEL_CATALOG_CHECKSUM,
  };
  return {
    title: safeText(value.title, 60, 'title', true),
    startWord,
    difficulty,
    submittedRoute,
    description: safeText(value.description, 400, 'description'),
    showCreator: value.showCreator !== false,
    computed,
  };
}

export function validateReview(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CustomLevelValidationError('Invalid review body.');
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const action = value.action === 'publish' || value.action === 'reject' ? value.action : '';
  if (!/^[0-9a-f-]{36}$/i.test(id) || !action) throw new CustomLevelValidationError('Invalid review action.');
  return { id, action, reviewNote: safeText(value.reviewNote, 400, 'review note', action === 'reject') };
}

function parsedRoute(value) {
  try {
    const route = JSON.parse(value);
    return Array.isArray(route) ? route : [];
  } catch { return []; }
}

export function levelPayload(row, options = {}) {
  const own = Boolean(options.own);
  const admin = Boolean(options.admin);
  const payload = {
    id: row.id,
    title: row.title,
    startWord: row.startWord,
    difficulty: row.difficulty,
    target: row.startWord.slice(0, 2),
    submittedRoute: parsedRoute(row.submittedRouteJson),
    computedRoute: parsedRoute(row.computedRouteJson),
    shortestMoves: Number(row.shortestMoves),
    challengeMoves: Number(row.challengeMoves),
    routeCount: Number(row.routeCount),
    branchWordCount: Number(row.branchWordCount),
    qualityCloserCount: Number(row.qualityCloserCount),
    maxMoves: Number(row.maxMoves),
    hintLimit: Number(row.hintLimit),
    description: row.description,
    creator: row.showCreator ? row.creatorNickname : '',
    createdAt: row.createdAt,
    publishedAt: row.publishedAt || null,
  };
  if (own || admin) Object.assign(payload, { status: row.status, reviewNote: row.reviewNote || '', dictionaryVersion: row.dictionaryVersion });
  if (admin) Object.assign(payload, { creator: row.creatorNickname, creatorEmail: row.creatorEmail });
  return payload;
}
