import { sortBy } from 'lodash-es';
import {
  BibleBook,
  BibleBookId,
  BibleBookMetadata,
  BibleData,
  BibleLookupOptions,
  BibleReference,
  BibleVersion,
  BibleVersionId,
  BibleVersionName
} from './types';
import {
  buildBibleReferenceFromParams,
  normalizeSearchText as coreNormalizeSearchText,
  getBibleBookMetadata,
  getBibleData,
  getDefaultVersion,
  getVersion
} from './utilities';

interface SearchParams {
  book: BibleBookId;
  chapter: number;
  verse: number | null;
  endVerse: number | null;
  version: string | null;
}

// Normalize the search text by removing extraneous characters and collapsing
// whitespace
export function normalizeSearchText(searchText: string): string {
  searchText = coreNormalizeSearchText(searchText);
  searchText = searchText.replace(/(\d)(?=[a-z])/gi, '$1 ');
  searchText = searchText.replace(/\s+/g, ' ');
  searchText = searchText.trim();
  return searchText;
}

export function getReferenceMatches(searchText: string): (string | undefined)[] | null {
  // \P{L} matches all characters which are not considered words in Unicode
  // (source: <https://stackoverflow.com/a/52205643/560642>)
  const bookRegex = /(\d?(?:[^\P{L}\d_]|\s)+|\d)\s?/u;
  const chapterRegex = /(\d+)\s?/u;
  const verseRegex = /(\d+)\s?/u;
  const endVerseRegex = /(\d+)?\s?/u;
  const versionRegex = /([^\P{L}\d_](?:[^\P{L}\d_]\d*|\s)*)?.*?/u;
  return searchText.match(
    new RegExp(
      `^${bookRegex.source}(?:${chapterRegex.source}(?:${verseRegex.source}${endVerseRegex.source})?${versionRegex.source})?$`,
      'iu'
    )
  );
}

// Parse out the search text into its parts (which we are calling 'parameters')
export function getSearchParams(searchText: string): SearchParams | null {
  const referenceMatch = getReferenceMatches(searchText);
  if (!referenceMatch) {
    return null;
  }

  const bookMatch = referenceMatch[1]?.trimEnd();
  const chapterMatch = referenceMatch[2];
  const verseMatch = referenceMatch[3];
  const endVerseMatch = referenceMatch[4];
  const versionMatch = referenceMatch[5];

  return {
    book: bookMatch || '',
    chapter: chapterMatch ? Math.max(1, parseInt(chapterMatch, 10)) : 1,
    verse: verseMatch ? Math.max(1, parseInt(verseMatch, 10)) : null,
    endVerse: endVerseMatch ? parseInt(endVerseMatch, 10) : null,
    version: versionMatch ? normalizeSearchText(versionMatch) : null
  };
}

// Finds a version which best matches the given version query
export function guessVersion(versions: BibleVersion[], versionSearchText: string): BibleVersion | null {
  // Chop off character from version query until matching version can be found
  // (if a matching version even exists)
  for (let i = versionSearchText.length; i > 0; i -= 1) {
    for (const version of versions) {
      const normalizedVersionName = normalizeSearchText(version.name);
      if (normalizedVersionName === versionSearchText.slice(0, i)) {
        return version;
      }
    }
  }
  // Give partial matches lower precedence over exact matches
  for (let i = versionSearchText.length; i > 0; i -= 1) {
    for (const version of versions) {
      const normalizedVersionName = normalizeSearchText(version.name);
      if (normalizedVersionName.startsWith(versionSearchText.slice(0, i))) {
        return version;
      }
    }
  }
  return null;
}

// Chooses most appropriate version based on current parameters
export function chooseBestVersion({
  fallbackVersionIdOrName,
  bible,
  searchParams
}: {
  fallbackVersionIdOrName: BibleVersionId | BibleVersionName | undefined;
  bible: BibleData;
  searchParams: SearchParams;
}): BibleVersion {
  const defaultVersion = getDefaultVersion(bible);
  if (searchParams.version) {
    return guessVersion(bible.versions, searchParams.version) || defaultVersion;
  } else if (fallbackVersionIdOrName) {
    return getVersion(bible, fallbackVersionIdOrName) || defaultVersion;
  }
  return defaultVersion;
}

// Split the given book name into an array of substrings
export function splitBookNameIntoParts(bookName: string): string[] {
  const bookWords = normalizeSearchText(bookName).split(' ');
  return bookWords.map((_word, w) => bookWords.slice(w).join(' '));
}

export async function getMatchingBooks(allBooks: BibleBook[], searchParams: SearchParams): Promise<BibleBook[]> {
  const matchingBooks: BibleBook[] = [];
  const bookPriorityMap: Record<BibleBookId, number> = {};

  allBooks.forEach((book, b) => {
    const bookNameWords = splitBookNameIntoParts(book.name);
    const w = bookNameWords.findIndex((bookNameWord) => {
      return bookNameWord.startsWith(searchParams.book);
    });
    if (w !== -1) {
      matchingBooks.push(book);
      // Give more priority to book names that are matched sooner
      // (e.g. if the query matched the first word of a book name,
      // as opposed to the second or third word)
      bookPriorityMap[book.id] = (w + 1) * 100 + b;
    }
  });
  // Even though TypeScript should be able to infer the type of `book` from the
  // type of `matchingBooks` (`BibleBook[]` -> `BibleBook`), the
  // rollup-plugin-dts package throws the error "Parameter 'book' implicitly has
  // an 'any' type"
  return sortBy(matchingBooks, (book: BibleBook) => bookPriorityMap[book.id]);
}

// Return a BibleReference object representing a single search result
export function getSearchResult({
  book,
  bookMetadata,
  searchParams,
  chosenVersion
}: {
  book: BibleBook;
  bookMetadata: BibleBookMetadata;
  searchParams: SearchParams;
  chosenVersion: BibleVersion;
}): BibleReference {
  const chapter = Math.min(searchParams.chapter, bookMetadata.chapters);
  const lastVerse = bookMetadata.verses[chapter - 1];

  const verse = searchParams.verse ? Math.min(searchParams.verse, lastVerse) : null;
  const endVerse = verse && searchParams.endVerse ? Math.min(searchParams.endVerse, lastVerse) : null;

  return buildBibleReferenceFromParams({
    book: book,
    chapter,
    verse,
    endVerse: verse && endVerse && endVerse > verse ? endVerse : null,
    version: chosenVersion
  });
}

// Retrieve a list of all Bible references matching a given search query
export async function getReferencesMatchingName(
  searchText: string,
  options: BibleLookupOptions = {}
): Promise<BibleReference[]> {
  searchText = normalizeSearchText(searchText);
  const searchParams = getSearchParams(searchText);
  if (!searchParams) {
    return [];
  }

  const bible = options.bible ?? (await getBibleData(options.language));
  const bookMetadata = await getBibleBookMetadata();

  const chosenVersion = chooseBestVersion({
    fallbackVersionIdOrName: options.fallbackVersion,
    bible,
    searchParams
  });

  return (await getMatchingBooks(bible.books, searchParams)).map((book) => {
    return getSearchResult({
      book,
      bookMetadata: bookMetadata[book.id],
      searchParams,
      chosenVersion
    });
  });
}

// Like the above getReferencesMatchingName() function, but only returns the
// first result
export async function getFirstReferenceMatchingName(
  searchText: string,
  options: BibleLookupOptions = {}
): Promise<BibleReference> {
  return (await getReferencesMatchingName(searchText, options))[0];
}
