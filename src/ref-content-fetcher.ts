import cheerio from 'cheerio';
import { getFirstReferenceMatchingName } from './lookup-reference';
import { BibleLookupOptions, BibleLookupOptionsWithBibleData, BibleReference } from './types';
import { baseReferenceUrl, buildBibleReferenceFromID, fetchHTML, getBibleData, isBibleReferenceID } from './utilities';

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
export function parseContentFromHTML(reference: BibleReference, html: string): string {
  const $ = cheerio.load(html);
  const $chapter = $("[class*='chapter']");
  const contentParts: string[] = [];
  // Loop over sections indicating paragraphs / breaks in the text
  $chapter.children().each((s, section) => {
    const $section = $(section);
    contentParts.push(...getSectionContent(reference, $, $section));
  });
  return normalizeRefContent(contentParts.join(''));
}

// Determine the appropriate amount of spacing (e.g. line/paragraph breaks) to
// insert before the given section of content
export function getSpacingBeforeSection(
  _reference: BibleReference,
  $: cheerio.Root,
  $section: cheerio.Cheerio
): string {
  const sectionType = $section.prop('class');
  if (classMatchesOneOf(sectionType, blockElems)) {
    return '\n\n';
  } else if (classMatchesOneOf(sectionType, breakElems)) {
    return '\n';
  } else {
    return '';
  }
}

// Return true if the given class name matches one of the patterns defined in
// the supplied elements set; matching is done literally and on word boundaries
// (e.g. so the class "ChapterContent_q1__ZQPnV" matches if "q1" is in the
// elements set)
export function classMatchesOneOf(className: string, elemsSet: Set<string>): boolean {
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
export function getSpacingAfterSection(_reference: BibleReference, $: cheerio.Root, $section: cheerio.Cheerio): string {
  const sectionType = $section.prop('class');
  if (classMatchesOneOf(sectionType, blockElems)) {
    return '\n\n';
  } else {
    return '';
  }
}

// Retrieve all reference content within the given section
export function getSectionContent(reference: BibleReference, $: cheerio.Root, $section: cheerio.Cheerio): string[] {
  const sectionContentParts = [getSpacingBeforeSection(reference, $, $section)];
  const $verses = $section.find("[class*='verse']");
  $verses.each((v, verse) => {
    const $verse = $(verse);
    if (isVerseWithinRange(reference, $, $verse)) {
      sectionContentParts.push(...$verse.find("[class*='content']").text());
    }
  });
  sectionContentParts.push(getSpacingAfterSection(reference, $, $section));
  return sectionContentParts;
}

// Return true if the given verse element is within the designated verse range
export function isVerseWithinRange(reference: BibleReference, $: cheerio.Root, $verse: cheerio.Cheerio): boolean {
  const verseNum = getVerseNumberFromClass(reference, $, $verse);
  if (reference.verse && reference.endVerse) {
    return verseNum >= reference.verse && verseNum <= reference.endVerse;
  } else if (reference.verse) {
    return verseNum === reference.verse;
  } else {
    return true;
  }
}

// Parse the verse number from the given verse element's HTML class
export function getVerseNumberFromClass(_reference: BibleReference, $: cheerio.Root, $verse: cheerio.Cheerio): number {
  return Number($verse.prop('class').match(/v(\d+)/i)[1]);
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
  options: BibleLookupOptions = {}
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
  const content = parseContentFromHTML(reference, html);
  if (content) {
    return {
      ...reference,
      content
    };
  } else {
    throw new Error('Fetched reference content is empty');
  }
}
