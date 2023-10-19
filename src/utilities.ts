import { ChildNode } from 'domhandler';
import parse from 'html-dom-parser';
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
let _fetchInstance: typeof fetch;

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
  // The consistency checks part of the youversion-suggest-data test suite
  // guarantee that every Bible data file has the default version present among
  // the available versions; therefore, because this check will never return
  // false, we can safely ignore the partial branch
  /* c8 ignore next */
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
  // Every call to buildBibleReferenceFromID() in this codebase in wrapped by an
  // isBibleReferenceID() check, and because these functions use the same regex,
  // this guarantees that the below matches array will always be non-empty;
  // therefore, the partial branch can safely be ignored
  /* c8 ignore next */
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
  return import(`./data/bible/bible-${language}.json`);
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
  if (_fetchInstance) {
    return _fetchInstance;
  } else if (typeof globalThis !== 'undefined' && globalThis.fetch) {
    _fetchInstance = globalThis.fetch;
    return _fetchInstance;
  } else {
    // node-fetch is effectively standards-compliant with the Fetch API, so from
    // a type level, we can safely treat it like native fetch() (and this is
    // preferable because cannot statically import node-fetch or any of its
    // included types)
    _fetchInstance = (await import('node-fetch')).default as unknown as typeof fetch;
    return _fetchInstance;
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

// Represents a synthetic DOM node parsed by the html-dom-parser package, which
// could represent an element, text node, comment, etc. (these types are defined
// in the domhandler package; right-click the `parse` function and choose "Go to
// Definition" for more details)
export type ParsedHTMLNode = ReturnType<typeof parse>[number] | ChildNode;

// Walk the tree of and return an array of all nodes for which the given
// callback function returns a truthy value
export function findMatchingNodes(
  root: ParsedHTMLNode,
  callback: (node: ParsedHTMLNode) => boolean | undefined
): ParsedHTMLNode[] {
  const matchingNodes: ParsedHTMLNode[] = [];
  const stack: ParsedHTMLNode[] = [root];

  if (!('children' in root)) {
    return matchingNodes;
  }

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }

    if (callback(node)) {
      matchingNodes.push(node);
      // We don't care about nested matching nodes, so as an optimization, we
      // can avoid traversing a matching node's children
      continue;
    }

    if (!('children' in node)) {
      continue;
    }
    // Children are added to the stack in reverse order so that the leftmost
    // child is visited first
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      if ('name' in child) {
        stack.push(child);
      }
    }
  }

  return matchingNodes;
}
// Like the above findMatchingNode() function, except it only looks for the
// first node which satisfies the callback, and then short-circuits by returning
// immediately and forgoing any additional traversal of the tree (which is why
// we are not calling findMatchingNodes)
export function findFirstMatchingNode(
  root: ParsedHTMLNode,
  callback: (node: ParsedHTMLNode) => boolean | undefined
): ParsedHTMLNode | null {
  const stack: ParsedHTMLNode[] = [root];

  if (!('children' in root)) {
    return null;
  }

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }

    if (callback(node)) {
      // As soon as we find a node which satisfies the callback, return
      // immediately
      return node;
    }

    if (!('children' in node)) {
      continue;
    }
    // Children are added to the stack in reverse order so that the leftmost
    // child is visited first
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      if ('name' in child) {
        stack.push(child);
      }
    }
  }

  return null;
}

// Because the ParsedHTMLElement type is a union type, where not all members of
// the union have a 'children' property, we would normally need to jump through
// some hoops in TypeScript to access the 'children' property; instead, we are
// using this helper function to consolidate that logic so that we can simplify
// the rest of code
export function getElementChildren(node: ParsedHTMLNode): ChildNode[] {
  if ('children' in node) {
    return node.children;
  } else {
    return [];
  }
}

// Because the ParsedHTMLElement type is a union type, where not all members of
// the union have a 'attribs' property, we would normally need to jump through
// some hoops in TypeScript to access the 'attribs' property; instead, we are
// using this helper function to consolidate that logic so that we can simplify
// the rest of code
export function getElementAttr(node: ParsedHTMLNode, attrName: string): string | undefined {
  if ('attribs' in node) {
    return node.attribs[attrName];
  } else {
    return undefined;
  }
}
// A variant of getElementAttr() that retrieves only the class string for the
// given node (if it exists); this was added because retrieving the class name
// for an element is quite common in this codebase
export function getElementClass(node: ParsedHTMLNode): string {
  return getElementAttr(node, 'class') || '';
}

// Recursively retrieve the text contents for the given node by concatenating
// together the textual contents of all text node children (unless the given
// node is a text node itself, then simply return that content)
export function getElementTextContent(node: ParsedHTMLNode): string {
  if ('data' in node) {
    return node.data;
  } else if ('children' in node) {
    const initialParts: string[] = [];
    return node.children
      .reduce((parts, node) => {
        parts.push(getElementTextContent(node));
        return parts;
      }, initialParts)
      .join('');
  } else {
    return '';
  }
}

// See
// <https://stackoverflow.com/questions/47632622/typescript-and-filter-boolean>
export function isTruthy<T>(value: T | null | undefined | false): value is T {
  return Boolean(value);
}
