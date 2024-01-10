import bookMetadata from './data/bible/book-metadata.json';
import languages from './data/bible/languages.json';
import { BibleReferenceNotFoundError } from './errors';
import type {
  BibleBookMetadata,
  BibleData,
  BibleLanguage,
  BibleLookupOptionsWithBibleData,
  BibleReference,
  BibleSearchOptionsWithBibleData,
  BibleVersion
} from './types';

// A regular expression pattern that represents the generic form of a Bible Reference identifier (e.g. 59/psa.23.1)
const BIBLE_REFERENCE_ID_PATTERN = /^(\d+)\/([a-z0-9]{3})\.(\d+)(?:\.(\d+)(?:-(\d+))?)?$/i;

// Cache the resolved instance of fetch() (whether native fetch or node-fetch)
// so that if node-fetch is used, it is not imported more than once
export const caches: { _fetchInstance: typeof fetch | undefined } = {
  _fetchInstance: undefined
};

export function normalizeSearchText(searchText: string): string {
  searchText = searchText.normalize('NFC');
  searchText = searchText.toLowerCase();
  // Remove all non-alphanumeric characters; \p{L} matches all characters which
  // are considered words in Unicode (source:
  // <https://stackoverflow.com/a/52205643/560642>)
  searchText = searchText.replace(/[^\p{L}\d]/giu, ' ');
  // Remove extra whitespace
  searchText = searchText.trim();
  searchText = searchText.replace(/\s+/g, ' ');
  return searchText;
}

// Retrieve the Bible verse object given the numeric ID of that version
export function getVersionById(bible: BibleData, versionId: number): BibleVersion | undefined {
  return bible.versions.find((version) => {
    return version.id === versionId;
  });
}

// Retrieve the Bible verse object given the string abbreviation name of that
// version
export function getVersionByName(bible: BibleData, versionName: string): BibleVersion | undefined {
  versionName = versionName.toLowerCase();
  return bible.versions.find((version) => {
    return version.name.toLowerCase() === versionName;
  });
}

// Retrieve the Bible version object given the numeric ID (or case-insensitive
// string abbreviation) of that version
export function getVersion(bible: BibleData, versionIdOrName: string | number): BibleVersion | undefined {
  if (typeof versionIdOrName === 'string') {
    const versionName = versionIdOrName;
    return getVersionByName(bible, versionName);
  } else {
    const versionId = versionIdOrName;
    return getVersionById(bible, versionId);
  }
}

// Retrieve the Bible version object which represents the default version for
// the given Bible data
export function getDefaultVersion(bible: BibleData): BibleVersion {
  return getVersionById(bible, bible.default_version) ?? bible.versions[0];
}

export function getReferenceID({
  book,
  chapter,
  verse,
  endVerse,
  version
}: Pick<BibleReference, 'book' | 'chapter' | 'verse' | 'endVerse' | 'version'>) {
  const bookId = book.id.toUpperCase();
  if (endVerse && verse) {
    return `${version.id}/${bookId}.${chapter}.${verse}-${endVerse}`;
  } else if (verse) {
    return `${version.id}/${bookId}.${chapter}.${verse}`;
  } else {
    return `${version.id}/${bookId}.${chapter}`;
  }
}

export function getReferenceName({
  book,
  chapter,
  verse,
  endVerse
}: Pick<BibleReference, 'book' | 'chapter' | 'verse' | 'endVerse'>) {
  if (endVerse && verse) {
    return `${book.name} ${chapter}:${verse}-${endVerse}`;
  } else if (verse) {
    return `${book.name} ${chapter}:${verse}`;
  } else {
    return `${book.name} ${chapter}`;
  }
}

export const baseReferenceUrl = 'https://www.bible.com/bible';
export const baseSearchUrl = 'https://www.bible.com/search/bible';

export function getReferenceIDFromURL(url: string): string {
  const matches = url?.trim().match(/(\d+\/(?:[^/]+))$/);
  if (matches) {
    return matches[1];
  } else {
    return '';
  }
}

export function buildBibleReferenceFromParams({
  book,
  chapter,
  verse,
  endVerse,
  version
}: Pick<BibleReference, 'book' | 'chapter' | 'verse' | 'endVerse' | 'version'>) {
  const id = getReferenceID({ book, chapter, verse, endVerse, version });
  const name = getReferenceName({ book, chapter, verse, endVerse });
  return {
    id,
    name,
    url: `${baseReferenceUrl}/${id}`,
    book,
    chapter,
    verse,
    endVerse,
    version
  };
}

// Return true if the given string is in the format of a Bible Reference ID;
// return false otherwise
export function isBibleReferenceID(searchText: string): boolean {
  return BIBLE_REFERENCE_ID_PATTERN.test(searchText);
}

export function buildBibleReferenceFromID(
  id: string,
  options: BibleLookupOptionsWithBibleData | BibleSearchOptionsWithBibleData
): BibleReference {
  const matches = id.match(BIBLE_REFERENCE_ID_PATTERN) ?? [];
  const versionId = Number(matches[1]);
  const bookId = matches[2].toLowerCase();
  const book = options.bible.books.find((book) => book.id === bookId);
  if (!book) {
    throw new BibleReferenceNotFoundError(`${bookId} is not a valid book ID`);
  }
  const chapter = Number(matches[3]);
  const verse = Number(matches[4]) || null;
  const endVerse = Number(matches[5]) || null;
  const version = getVersionById(options.bible, versionId);
  if (!version) {
    throw new BibleReferenceNotFoundError(`${versionId} is not a valid version ID`);
  }
  return buildBibleReferenceFromParams({
    book,
    chapter: chapter,
    verse: verse ? verse : null,
    endVerse: endVerse ? endVerse : null,
    version
  });
}

export async function getBibleData(language = 'eng'): Promise<BibleData> {
  // Apparently, using string concatenation (instead of a template literal)
  // fixes the ability for the coverage reporter to see this dynamic import as
  // properly covered
  return import('./data/bible/bible-' + language + '.json');
}

export async function getBibleBookMetadata(): Promise<Record<string, BibleBookMetadata>> {
  return bookMetadata;
}

export async function getLanguages(): Promise<BibleLanguage[]> {
  return languages;
}

// To support JavaScript environments with/without native fetch support, the
// library first checks if native fetch() is available, and if not, falls back
// to the node-fetch library; this implies that if native fetch is not
// available, the library can only be used in a Node context (since node-fetch
// can only run in a Node context)
export async function getFetch(): Promise<typeof fetch> {
  if (caches._fetchInstance) {
    return caches._fetchInstance;
  } else if (typeof globalThis !== 'undefined' && globalThis.fetch) {
    caches._fetchInstance = globalThis.fetch;
    return caches._fetchInstance;
  } else {
    // node-fetch is effectively standards-compliant with the Fetch API, so from
    // a type level, we can safely treat it like native fetch() (and this is
    // preferable because we cannot statically import node-fetch or any of its
    // included types)
    caches._fetchInstance = (await import('node-fetch')).default as unknown as typeof fetch;
    return caches._fetchInstance;
  }
}

export async function fetchHTML(url: string): Promise<string> {
  const fetch = await getFetch();
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'YouVersion Suggest'
    }
  });
  return response.text();
}

// See
// <https://stackoverflow.com/questions/47632622/typescript-and-filter-boolean>
export function isTruthy<T>(value: T | null | undefined | false): value is T {
  return Boolean(value);
}
