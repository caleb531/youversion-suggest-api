import { sortBy } from 'lodash-es';
import {
  BibleBook,
  BibleBookId,
  BibleBookMetadata,
  BibleData,
  BibleOptions,
  BibleReference,
  BibleVersion,
  BibleVersionId,
} from './types';
import {
  buildBibleReferenceFromParams,
  normalizeSearchText as coreNormalizeSearchText,
  getBibleBookMetadata,
  getBibleData,
} from './utilities';

interface BibleBookMatch extends BibleBook {
  priority: number;
  metadata: BibleBookMetadata;
}

interface SearchState {
  results: BibleReference[];
  isLoading: boolean;
}
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
  const bookRegex = /(\d?(?:[^\W\d_]|\s)+|\d)\s?/;
  const chapterRegex = /(\d+)\s?/;
  const verseRegex = /(\d+)\s?/;
  const endVerseRegex = /(\d+)?\s?/;
  const versionRegex = /([^\W\d_](?:[^\W\d_]\d*|\s)*)?.*?/;
  return searchText.match(
    new RegExp(
      `^${bookRegex.source}(?:${chapterRegex.source}(?:${verseRegex.source}${endVerseRegex.source})?${versionRegex.source})?$`,
      'i'
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
    version: versionMatch ? normalizeSearchText(versionMatch) : null,
  };
}

// Finds a version which best matches the given version query
export function guessVersion(versions: BibleVersion[], versionSearchText: string): BibleVersion | null {
  // Chop off character from version query until matching version can be found
  // (if a matching version even exists)
  for (let i = versionSearchText.length; i >= 0; i -= 1) {
    for (const version of versions) {
      const normalizedVersionName = normalizeSearchText(version.name);
      if (normalizedVersionName === versionSearchText.slice(0, i)) {
        return version;
      }
    }
  }
  // Give partial matches lower precedence over exact matches
  for (let i = versionSearchText.length; i >= 0; i -= 1) {
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
export function chooseBestVersion(
  preferredVersionId: BibleVersionId,
  bible: BibleData,
  searchParams: SearchParams
): BibleVersion {
  const defaultVersion = bible.versions.find((version) => version.id === bible.default_version);
  if (searchParams.version) {
    return guessVersion(bible.versions, searchParams.version) || defaultVersion;
  } else if (preferredVersionId) {
    return bible.versions.find((version) => version.id === preferredVersionId) || defaultVersion;
  }
  return defaultVersion || bible.versions[0];
}

// Split the given book name into an array of substrings
export function splitBookNameIntoParts(bookName: string): string[] {
  const bookWords = normalizeSearchText(bookName).split(' ');
  return bookWords.map((_word, w) => bookWords.slice(w).join(' '));
}

export async function getMatchingBooks(allBooks: BibleBook[], searchParams: SearchParams): Promise<BibleBookMatch[]> {
  const matchingBooks: BibleBookMatch[] = [];
  const bookMetadata = await getBibleBookMetadata();

  allBooks.forEach((book, b) => {
    const bookNameWords = splitBookNameIntoParts(book.name);
    const w = bookNameWords.findIndex((bookNameWord) => {
      return bookNameWord.startsWith(searchParams.book);
    });
    if (w !== -1) {
      matchingBooks.push({
        ...book,
        // Give more priority to book names that are matched sooner
        // (e.g. if the query matched the first word of a book name,
        // as opposed to the second or third word)
        priority: (w + 1) * 100 + b,
        // Store the metadata for the respective book (e.g. chapter
        // count) on this matching book object for convenience
        metadata: bookMetadata[book.id],
      });
    }
  });
  return sortBy(matchingBooks, (book) => book.priority);
}

// Return a BibleReference object representing a single search result
export function getSearchResult(
  book: BibleBookMatch,
  searchParams: SearchParams,
  chosenVersion: BibleVersion
): BibleReference {
  const chapter = Math.min(searchParams.chapter, book.metadata.chapters);
  const lastVerse = book.metadata.verses[chapter - 1];

  return buildBibleReferenceFromParams({
    book: book,
    chapter,
    verse: searchParams.verse ? Math.min(searchParams.verse, lastVerse) : null,
    endVerse: searchParams.endVerse ? Math.min(searchParams.endVerse, lastVerse) : null,
    version: chosenVersion,
  });
}

// Retrieve a list of all Bible references matching a given search query
export async function getReferencesMatchingName(searchText: string, options: BibleOptions): Promise<BibleReference[]> {
  searchText = normalizeSearchText(searchText);
  const searchParams = getSearchParams(searchText);
  if (!searchParams) {
    return [];
  }

  const bible = options.bible ?? (await getBibleData(options.language));

  const chosenVersion = chooseBestVersion(options.version, bible, searchParams);

  return (await getMatchingBooks(bible.books, searchParams)).map((bibleBook) => {
    return getSearchResult(bibleBook, searchParams, chosenVersion);
  });
}

// Like the above getReferencesMatchingName() function, but only returns the first result
export async function getFirstReferenceMatchingName(
  searchText: string,
  options: BibleOptions
): Promise<BibleReference> {
  return (await getReferencesMatchingName(searchText, options))[0];
}
