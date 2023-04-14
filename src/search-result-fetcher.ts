import cheerio from 'cheerio';
import defaultOptions from './default-options.json';
import { BibleOptionsWithBibleData, BibleReference } from './types';
import { baseSearchUrl, buildBibleReferenceFromID, fetchHTML, getReferenceIDFromURL } from './utilities';

// Fetch the textual content of the given Bible reference; returns a promise
export async function searchBibleForPhrase(searchText: string, options: BibleOptionsWithBibleData) {
  const preferredVersionId = options.version || defaultOptions.version;
  const html = await fetchHTML(`${baseSearchUrl}?q=${encodeURIComponent(searchText)}&version_id=${preferredVersionId}`);
  const references = parseContentFromHTML(html, options);
  return references;
}

export async function parseContentFromHTML(
  html: string,
  options: BibleOptionsWithBibleData
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
