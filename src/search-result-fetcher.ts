import cheerio from 'cheerio';
import { BibleReference, BibleSearchOptions, BibleSearchOptionsWithBibleData } from './types';
import {
  baseSearchUrl,
  buildBibleReferenceFromID,
  fetchHTML,
  getBibleData,
  getDefaultVersion,
  getReferenceIDFromURL
} from './utilities';

// Fetch the textual content of the given Bible reference; returns a promise
export async function getReferencesMatchingPhrase(searchText: string, options: BibleSearchOptions = {}) {
  const bible = options.bible ?? (await getBibleData(options.language));
  const preferredVersionId = options.version || getDefaultVersion(bible);
  const html = await fetchHTML(`${baseSearchUrl}?q=${encodeURIComponent(searchText)}&version_id=${preferredVersionId}`);
  return parseContentFromHTML(html, { bible });
}

export async function parseContentFromHTML(
  html: string,
  options: BibleSearchOptionsWithBibleData
): Promise<BibleReference[]> {
  const $ = cheerio.load(html);
  const $references = $("a[href*='/bible/']");

  const results: BibleReference[] = [];
  $references.each((r, referenceElem) => {
    const $reference = $(referenceElem);
    const reference = buildBibleReferenceFromID(getReferenceIDFromURL($reference.prop('href')), options);
    reference.content = $reference.parent().next('p').text().trim();
    if (reference) {
      results.push(reference);
    }
  });
  return results;
}
