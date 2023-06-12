import fetch from 'node-fetch';
import bookMetadata from './data/bible/book-metadata.json';
import languages from './data/bible/languages.json';
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
  const chapter = Number(matches[3]);
  const verse = Number(matches[4]) || null;
  const endVerse = Number(matches[5]) || null;
  return buildBibleReferenceFromParams({
    book: options.bible.books.find((book) => book.id === bookId) ?? {
      id: '',
      name: ''
    },
    chapter: chapter,
    verse: verse ? verse : null,
    endVerse: endVerse ? endVerse : null,
    version: getVersionById(options.bible, versionId) ?? {
      id: 0,
      name: '',
      full_name: ''
    }
  });
}

export async function getBibleData(language = 'eng'): Promise<BibleData> {
  return import(`./data/bible/bible-${language}.json`);
}

export async function getBibleBookMetadata(): Promise<Record<string, BibleBookMetadata>> {
  return bookMetadata;
}

export async function getLanguages(): Promise<BibleLanguage[]> {
  return languages;
}

export async function fetchHTML(url: string): Promise<string> {
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
