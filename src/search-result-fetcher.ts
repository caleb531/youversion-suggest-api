import { HTMLRewriter, Element as HTMLRewriterElement, TextChunk } from '@worker-tools/html-rewriter/base64';
import { decode as decodeHTMLEntities } from 'html-entities';
import type { BibleReference, BibleSearchOptions, BibleSearchOptionsWithBibleData } from './types';
import {
  baseSearchUrl,
  buildBibleReferenceFromID,
  fetchHTML,
  getBibleData,
  getDefaultVersion,
  getReferenceIDFromURL,
  getVersionByIdOrName
} from './utilities';

async function parseContentFromHTML(html: string, options: BibleSearchOptionsWithBibleData): Promise<BibleReference[]> {
  let currentReferenceID: string | null;
  let currentReferenceContentElem: HTMLRewriterElement | null;
  const currentReferenceContentParts: string[] = [];
  const references: BibleReference[] = [];
  const rewriter = new HTMLRewriter();

  rewriter
    // Each anchor tag with a link to the Bible can be regarded as the hyperlink
    // heading for a reference
    .on("a[href*='/bible/']", {
      element(element: HTMLRewriterElement) {
        const href = element.getAttribute('href');
        // TypeScript isn't aware that the selector we are using guarantees a
        // non-empty value, so we need to include a guard clause here
        if (!href) {
          return;
        }
        currentReferenceID = getReferenceIDFromURL(href);
      }
    })
    // Handle the content of the reference result
    .on('p', {
      element(element: HTMLRewriterElement) {
        // Skip over any paragraph that doesn't belong to a search result
        if (!currentReferenceID) {
          return;
        }
        currentReferenceContentElem = element;
        // Only when we reach the closing </p> tag do we want to take the
        // collected text contents of the reference and add an entry to our
        // results array
        element.onEndTag(() => {
          if (currentReferenceID) {
            references.push({
              ...buildBibleReferenceFromID(currentReferenceID, options),
              content: decodeHTMLEntities(currentReferenceContentParts.join(''))
            });
            currentReferenceContentParts.length = 0;
            currentReferenceID = null;
          }
        });
      },
      // Collect textual contents of reference result as we encounter text nodes
      // within the result's <p> tag
      text(text: TextChunk) {
        const content = text.text.trim();
        if (currentReferenceID && currentReferenceContentElem) {
          currentReferenceContentParts.push(content);
        }
      }
    });

  await rewriter.transform(new Response(html)).text();
  return references;
}

// Fetch the textual content of the given Bible reference; returns a promise
export async function getReferencesMatchingPhrase(searchText: string, options: BibleSearchOptions = {}) {
  const bible = options.bible ?? (await getBibleData(options.language));
  const preferredVersion = getVersionByIdOrName(bible, options.version) || getDefaultVersion(bible);
  const searchParams = new URLSearchParams({
    q: searchText,
    version_id: String(preferredVersion)
  });
  const html = await fetchHTML(`${baseSearchUrl}?${searchParams}`, {
    headers: {
      Cookie: `version=${preferredVersion.id}`
    }
  });
  return parseContentFromHTML(html, { bible });
}
