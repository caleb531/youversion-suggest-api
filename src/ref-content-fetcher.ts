import cheerio from 'cheerio';
import { getFirstReferenceMatchingName } from './lookup-reference';
import { BibleLookupOptions, BibleLookupOptionsWithBibleData, BibleReference } from './types';
import { baseReferenceUrl, buildBibleReferenceFromID, fetchHTML, getBibleData, isBibleReferenceID } from './utilities';

// Additional options to fetchReferenceContent() which control what is included
// in reference content
export interface BibleFetchOptions extends BibleLookupOptions {
  includeVerseNumbers?: boolean;
  includeLineBreaks?: boolean;
}

// Elements that should be surrounded by blank lines
export const blockElems = new Set(['b', 'p', 'm']);
// Elements that should trigger a single line break
export const breakElems = new Set(['li1', 'q1', 'q2', 'qc']);

// Retrieve the URL to the Bible chapter
export function getChapterURL(reference: BibleReference): string {
  const { version, book, chapter } = reference;
  return `${baseReferenceUrl}/${version.id}/${book.id.toUpperCase()}.${chapter}`;
}

// Parse the given YouVersion HTML and return a string a reference content
export function parseContentFromHTML(reference: BibleReference, html: string, options: BibleFetchOptions): string {
  const $ = cheerio.load(html);
  const $chapter = $("[class*='chapter']");
  const contentParts = getElementContent(reference, $, $chapter, options);
  return normalizeRefContent(contentParts.join(''));
}

// Determine the appropriate amount of spacing (e.g. line/paragraph breaks) to
// insert before the given section of content
export function getSpacingBeforeElement(
  _reference: BibleReference,
  $: cheerio.Root,
  $element: cheerio.Cheerio,
  options: BibleFetchOptions
): string {
  const elementType = $element.prop('class');
  if (classMatchesOneOf(elementType, blockElems)) {
    return options.includeLineBreaks ? '\n\n' : ' ';
  } else if (classMatchesOneOf(elementType, breakElems)) {
    return options.includeLineBreaks ? '\n' : ' ';
  } else {
    return '';
  }
}

// Return true if the given class name matches one of the patterns defined in
// the supplied elements set; matching is done literally and on word boundaries
// (e.g. so the class "ChapterContent_q1__ZQPnV" matches if "q1" is in the
// elements set)
export function classMatchesOneOf(className: string, elemsSet: Iterable<string>): boolean {
  const elemsUnion = Array.from(elemsSet).join('|');
  return new RegExp(`\\b(${elemsUnion})\\b`).test(
    // The normal regex word boundary (\b) considers underscores as part of the
    // definition of a "word"; this will not work for us since the class names
    // we are dealing with have underscore-delimited segments, and we need to
    // treat each of those segments as distinct "words"; fortunately, we can
    // simply replace underscores in the class name string with hyphens (or
    // spaces, for that matter) to appease the word boundaries
    className.replace(/_/g, ' ')
  );
}

// Determine the spacing to insert after the given section of content
export function getSpacingAfterElement(
  _reference: BibleReference,
  $: cheerio.Root,
  $element: cheerio.Cheerio,
  options: BibleFetchOptions
): string {
  const elementType = $element.prop('class');
  if (classMatchesOneOf(elementType, blockElems)) {
    return options.includeLineBreaks ? '\n\n' : ' ';
  } else {
    return '';
  }
}

// Recursively retrieve all reference content within the given element
export function getElementContent(
  reference: BibleReference,
  $: cheerio.Root,
  $element: cheerio.Cheerio,
  options: BibleFetchOptions
): string[] {
  const contentParts = [getSpacingBeforeElement(reference, $, $element, options)];
  $element.children().each((c, child) => {
    const $child = $(child);
    if (classMatchesOneOf($child.prop('class'), ['verse'])) {
      contentParts.push(...getVerseContent(reference, $, $child, options));
    } else if (classMatchesOneOf($child.prop('class'), new Set([...blockElems, ...breakElems]))) {
      contentParts.push(...getElementContent(reference, $, $child, options));
    }
  });
  contentParts.push(getSpacingAfterElement(reference, $, $element, options));
  return contentParts;
}

// Retrieve the contents for the given verse (including the verse number label,
// if enabled)
export function getVerseContent(
  reference: BibleReference,
  $: cheerio.Root,
  $verse: cheerio.Cheerio,
  options: BibleFetchOptions
): string[] {
  const contentParts = [];
  if (!isVerseWithinRange(reference, $, $verse)) {
    return [];
  }
  if (options.includeVerseNumbers) {
    contentParts.push(' ', $verse.children("[class*='label']").text(), ' ');
  }
  contentParts.push(' ', $verse.children("[class*='content']").text(), ' ');
  return contentParts;
}

// Return true if the given verse element is within the designated verse range
export function isVerseWithinRange(reference: BibleReference, $: cheerio.Root, $verse: cheerio.Cheerio): boolean {
  // If reference represents an entire chapter, then all verses are within range
  if (!reference.verse) {
    return true;
  }
  const startVerse = reference.verse;
  const endVerse = reference.endVerse ?? startVerse;
  // Get all verse numbers that this verse represents (e.g. for versions such as
  // MSG that consolidate multiple verses into one (e.g. "7-9"))
  const verseNums: number[] = $verse
    .prop('class')
    .split(' ')
    .filter((className: string) => className.startsWith('v'))
    .map((className: string) => Number(className.slice(1)));
  return verseNums.some((verseNum) => {
    return verseNum >= startVerse && verseNum <= endVerse;
  });
}

// Strip superfluous whitespace from throughout reference content
export function normalizeRefContent(content: string): string {
  // Strip leading/trailing whitespace for entire reference
  content = content.trim();
  // Collapse consecutive spaces into a single space
  content = content.replace(/ {2,}/gi, ' ');
  // Collapse sequences of three or more newlines into two
  content = content.replace(/\n{3,}/gi, '\n\n');
  // Strip leading/trailing whitespace for each paragraph
  content = content.replace(/ ?\n ?/gi, '\n');
  return content;
}

export async function buildBibleReferenceFromSearchText(
  searchText: string,
  options: BibleLookupOptionsWithBibleData
): Promise<BibleReference> {
  if (isBibleReferenceID(searchText)) {
    return buildBibleReferenceFromID(searchText, options);
  } else {
    return (await getFirstReferenceMatchingName(searchText, options)) ?? null;
  }
}

// Fetch the textual content of the given Bible reference; returns a promise
export async function fetchReferenceContent(
  searchText: string,
  options: BibleFetchOptions = {}
): Promise<BibleReference> {
  const bible = await getBibleData(options.language);
  const reference = await buildBibleReferenceFromSearchText(searchText, {
    ...options,
    bible
  });
  if (!reference) {
    throw new Error('Reference does not exist');
  }
  const html = await fetchHTML(getChapterURL(reference));
  const content = parseContentFromHTML(reference, html, {
    includeVerseNumbers: options.includeVerseNumbers ?? false,
    includeLineBreaks: options.includeLineBreaks ?? true
  });
  if (content) {
    return {
      ...reference,
      content
    };
  } else {
    throw new Error('Fetched reference content is empty');
  }
}
