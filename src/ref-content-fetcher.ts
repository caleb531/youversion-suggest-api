import { HTMLRewriter } from 'htmlrewriter';
import { Element as HTMLRewriterElement, TextChunk } from 'htmlrewriter/dist/types';
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
const blockTags = new Set(['b', 'p', 'm']);
// Elements that should trigger a single line break
const breakTags = new Set(['li1', 'q', 'q1', 'q2', 'qc', 'qr', 'qm1', 'qm2']);

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
  if (classMatchesOneOf(elementType, blockTags)) {
    return options.includeLineBreaks ? '\n\n' : ' ';
  } else if (classMatchesOneOf(elementType, breakTags)) {
    return options.includeLineBreaks ? '\n' : ' ';
  } else {
    return '';
  }
}

// Construct an array of all verse numbers that this verse represents (e.g. for
// versions such as MSG that consolidate multiple verses into one (e.g. "7-9"))
function getVerseNumsFromVerse(verseElem: HTMLRewriterElement): number[] {
  const usfmStr = verseElem.getAttribute('data-usfm');
  if (usfmStr) {
    return Array.from(usfmStr.matchAll(/(\w+)\.(\d+)\.(\d+)/g)).map((verseNumMatch) => {
      return Number(verseNumMatch[3]);
    });
  } else {
    return [];
  }
}

// Return true if the given verse element is within the designated verse range
function isVerseWithinRange(reference: BibleReference, verseNums: number[]): boolean {
  // If reference represents an entire chapter, then all verses are within range
  if (!reference.verse) {
    return true;
  }
  const startVerse = reference.verse;
  const endVerse = reference.endVerse ?? startVerse;
  return verseNums.some((verseNum) => {
    return verseNum >= startVerse && verseNum <= endVerse;
  });
}

// Determine the spacing to insert after the given section of content
function getSpacingAfterElement(
  _reference: BibleReference,
  $: cheerio.Root,
  $element: cheerio.Cheerio,
  options: BibleFetchOptions
): string {
  const elementType = $element.prop('class');
  if (classMatchesOneOf(elementType, blockTags)) {
    return options.includeLineBreaks ? '\n\n' : ' ';
  } else {
    return '';
  }
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

// Parse content using Cloudflare's HTMLRewriter
async function parseContentFromHTML(
  reference: BibleReference,
  html: string,
  options: BibleFetchOptions
): Promise<string> {
  let currentBlockElem: HTMLRewriterElement | null;
  let currentVerseElem: HTMLRewriterElement | null;
  let currentVerseLabelElem: HTMLRewriterElement | null;
  let currentVerseContentElem: HTMLRewriterElement | null;
  let currentVerseNoteElem: HTMLRewriterElement | null;
  let verseNums: number[] | null;
  const contentParts: string[] = [];
  const rewriter = new HTMLRewriter();
  rewriter.on('[class*="chapter"] *', {
    element: (element) => {
      const className = element.getAttribute('class');
      // It's perfectly valid for an HTML element to have a class attribute
      // without a value, and if that's the case, we skip over that element
      if (!className) {
        return;
      }
      const isInVerse = Boolean(currentVerseElem && verseNums && isVerseWithinRange(reference, verseNums));
      // Detect paragraph breaks between verses
      if (classMatchesOneOf(className, blockTags) && !isInVerse) {
        contentParts.push(options.includeLineBreaks ? '\n\n' : ' ');
      }
      // Detect line breaks within a single verse
      if (classMatchesOneOf(className, breakTags) && !isInVerse) {
        contentParts.push(options.includeLineBreaks ? '\n' : ' ');
      }
      // Detect beginning of a single verse (may include footnotes)
      if (classMatchesOneOf(className, ['verse'])) {
        currentVerseElem = element;
        verseNums = getVerseNumsFromVerse(currentVerseElem);
      }
      // Detect label containing the associated verse number(s)
      if (classMatchesOneOf(className, ['label'])) {
        currentVerseLabelElem = element;
      }
      // Detect beginning of verse content (excludes footnotes)
      if (classMatchesOneOf(className, ['content'])) {
        currentVerseContentElem = element;
      }
      // Detect footnotes and cross-references
      if (classMatchesOneOf(className, ['note'])) {
        currentVerseNoteElem = element;
      }
      // Properly reset state when reaching the ends of elements
      element.onEndTag(() => {
        if (element === currentBlockElem) {
          contentParts.push(options.includeLineBreaks ? '\n' : ' ');
          currentBlockElem = null;
        } else if (element === currentVerseElem) {
          currentVerseElem = null;
        } else if (element === currentVerseLabelElem) {
          currentVerseLabelElem = null;
        } else if (element === currentVerseContentElem) {
          currentVerseContentElem = null;
        } else if (element === currentVerseNoteElem) {
          currentVerseNoteElem = null;
        }
      });
    },
    text(text: TextChunk) {
      if (currentVerseElem && options.includeVerseNumbers && currentVerseLabelElem && !currentVerseNoteElem) {
        contentParts.push(' ', text.text.trim(), ' ');
      }
      if (
        currentVerseElem &&
        currentVerseContentElem &&
        !currentVerseNoteElem &&
        verseNums &&
        isVerseWithinRange(reference, verseNums)
      ) {
        contentParts.push(text.text);
      }
    }
  });
  await rewriter.transform(new Response(html)).text();
  return normalizeRefContent(contentParts.join(''));
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
  const content = await parseContentFromHTML(reference, html, {
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
