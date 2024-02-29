import cheerio from 'cheerio';
import { BibleReferenceEmptyContentError, BibleReferenceNotFoundError } from './errors';
import { getFirstReferenceMatchingName } from './lookup-reference';
import type { BibleLookupOptions, BibleLookupOptionsWithBibleData, BibleReference } from './types';
import { baseReferenceUrl, buildBibleReferenceFromID, fetchHTML, getBibleData, isBibleReferenceID } from './utilities';

// Additional options to fetchReferenceContent() which control what is included
// in reference content
export interface BibleFetchOptions extends BibleLookupOptions {
  includeVerseNumbers?: boolean;
  includeLineBreaks?: boolean;
}

// Elements that should be surrounded by blank lines
const blockElems = new Set(['b', 'p', 'm']);
// Elements that should trigger a single line break
const breakElems = new Set(['li1', 'q', 'q1', 'q2', 'qc']);

// Return true if the given class name matches one of the patterns defined in
// the supplied elements set; matching is done literally and on word boundaries
// (e.g. so the class "ChapterContent_q1__ZQPnV" matches if "q1" is in the
// elements set)
function classMatchesOneOf(className: string, elemsSet: Iterable<string>): boolean {
  const elemsUnion = Array.from(elemsSet).join('|');
  return new RegExp(`\\b(${elemsUnion})--`).test(
    // The normal regex word boundary (\b) considers underscores as part of the
    // definition of a "word"; this will not work for us since the class names
    // we are dealing with have underscore-delimited segments, and we need to
    // treat each of those segments as distinct "words"; fortunately, we can
    // simply replace underscores in the class name string with hyphens (or
    // spaces, for that matter) to appease the word boundaries
    className.replace(/_/g, '-')
  );
}

// Determine the appropriate amount of spacing (e.g. line/paragraph breaks) to
// insert before the given section of content
function getSpacingBeforeElement(
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

// Return an array of verse numbers assigned to a given verse (there can be
// multiple verse numbers in the case of versions like The Message / MSG)
function getVerseNumsFromVerse($verse: cheerio.Cheerio): number[] {
  const usfmStr = $verse.attr('data-usfm');
  if (usfmStr) {
    return Array.from(usfmStr.matchAll(/(\w+)\.(\d+)\.(\d+)/g)).map((verseNumMatch) => {
      return Number(verseNumMatch[3]);
    });
  } else {
    return [];
  }
}

// Return true if the given verse element is within the designated verse range
function isVerseWithinRange(reference: BibleReference, $: cheerio.Root, $verse: cheerio.Cheerio): boolean {
  // If reference represents an entire chapter, then all verses are within range
  if (!reference.verse) {
    return true;
  }
  const startVerse = reference.verse;
  const endVerse = reference.endVerse ?? startVerse;
  // Get all verse numbers that this verse represents (e.g. for versions such as
  // MSG that consolidate multiple verses into one (e.g. "7-9"))
  const verseNums = getVerseNumsFromVerse($verse);
  return verseNums.some((verseNum) => {
    return verseNum >= startVerse && verseNum <= endVerse;
  });
}

// Retrieve the contents for the given verse (including the verse number label,
// if enabled)
function getVerseContent(
  reference: BibleReference,
  $: cheerio.Root,
  $verse: cheerio.Cheerio,
  options: BibleFetchOptions
): string {
  if (!isVerseWithinRange(reference, $, $verse)) {
    return '';
  }
  return [
    options.includeVerseNumbers ? ` ${$verse.children("[class*='label']").text()} ` : '',
    ` ${$verse.find("[class*='content']").text()} `
  ].join('');
}

// Determine the spacing to insert after the given section of content
function getSpacingAfterElement(
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
function getElementContent(
  reference: BibleReference,
  $: cheerio.Root,
  $element: cheerio.Cheerio,
  options: BibleFetchOptions
): string {
  const blockOrBreakElems = new Set([...blockElems, ...breakElems]);
  return [
    getSpacingBeforeElement(reference, $, $element, options),
    Array.from($element.children())
      .map((child) => {
        const $child = $(child);
        if (classMatchesOneOf($child.prop('class'), ['verse'])) {
          return getVerseContent(reference, $, $child, options);
        } else if (classMatchesOneOf($child.prop('class'), blockOrBreakElems)) {
          return getElementContent(reference, $, $child, options);
        } else {
          return '';
        }
      })
      .join(''),
    getSpacingAfterElement(reference, $, $element, options)
  ].join('');
}

// Strip superfluous whitespace from throughout reference content
function normalizeRefContent(content: string): string {
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

// Parse the given YouVersion HTML and return a string a reference content
function parseContentFromHTML(reference: BibleReference, html: string, options: BibleFetchOptions): string {
  const $ = cheerio.load(html);
  const $chapter = $("[class*='chapter']");
  const content = getElementContent(reference, $, $chapter, options);
  return normalizeRefContent(content);
}

// Retrieve the URL to the Bible chapter
function getChapterURL(reference: BibleReference): string {
  const { version, book, chapter } = reference;
  return `${baseReferenceUrl}/${version.id}/${book.id.toUpperCase()}.${chapter}`;
}

async function buildBibleReferenceFromSearchText(
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
    throw new BibleReferenceNotFoundError('Reference does not exist');
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
    throw new BibleReferenceEmptyContentError('Fetched reference content is empty');
  }
}
