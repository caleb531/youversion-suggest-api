import cheerio from 'cheerio';
import type { BibleReference, BibleSearchOptions, BibleSearchOptionsWithBibleData } from './types';
import {
  baseSearchUrl,
  buildBibleReferenceFromID,
  fetchHTML,
  getBibleData,
  getDefaultVersion,
  getReferenceIDFromURL
} from './utilities';

async function parseContentFromHTML(html: string, options: BibleSearchOptionsWithBibleData): Promise<BibleReference[]> {
  const $ = cheerio.load(html);
  const $references = $("a[href*='/bible/']");

  return Array.from($references)
    .map((referenceElem) => {
      const $reference = $(referenceElem);
      const referenceId = getReferenceIDFromURL($reference.prop('href'));
      const reference = buildBibleReferenceFromID(referenceId, options);
      return {
        ...reference,
        content: $reference.parent().next('p').text().trim()
      };
    })
    .filter(Boolean);
}

// Fetch the textual content of the given Bible reference; returns a promise
export async function getReferencesMatchingPhrase(searchText: string, options: BibleSearchOptions = {}) {
  const bible = options.bible ?? (await getBibleData(options.language));
  const preferredVersionId = options.version || getDefaultVersion(bible);
  const html = await fetchHTML(`${baseSearchUrl}?q=${encodeURIComponent(searchText)}&version_id=${preferredVersionId}`);
  return parseContentFromHTML(html, { bible });
}
