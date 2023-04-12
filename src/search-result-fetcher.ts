import cheerio from 'cheerio';
import defaultOptions from './default-options.json';
import { BibleOptions, BibleReference } from './types';
import { baseSearchUrl, buildBibleReferenceFromID, fetchHTML, getBibleData, getReferenceIDFromURL } from './utilities';

// Fetch the textual content of the given Bible reference; returns a promise
export async function searchBibleForPhrase(searchText: string, options: BibleOptions) {
  const preferredVersionId = options.version || defaultOptions.version;
  const html = await fetchHTML(`${baseSearchUrl}?q=${encodeURIComponent(searchText)}&version_id=${preferredVersionId}`);
  const references = parseContentFromHTML(html, options);
  return references;
}

export async function parseContentFromHTML(html: string, options: BibleOptions): Promise<BibleReference[]> {
  const $ = cheerio.load(html);
  const $references = $("a[href*='/bible/']");

  const bible = await getBibleData(options.language);

  const results: BibleReference[] = [];
  $references.each((r, referenceElem) => {
    const $reference = $(referenceElem);
    const reference = buildBibleReferenceFromID(getReferenceIDFromURL($reference.prop('href')), bible);
    reference.content = $reference.parent().next('p').text().trim();
    if (reference) {
      results.push(reference);
    }
  });
  return results;
}
