/* c8 ignore next (fixes a strange bug where c8 flags the first line of this file as a partial branch */

// The below functions comprise the public API for the library
export { BibleReferenceEmptyContentError, BibleReferenceError, BibleReferenceNotFoundError } from './errors';
export { getFirstReferenceMatchingName, getReferencesMatchingName } from './lookup-reference';
export { fetchReferenceContent } from './ref-content-fetcher';
export { getReferencesMatchingPhrase } from './search-result-fetcher';
export { getBibleBookMetadata, getBibleData, getLanguages, setBibleDataDirBase } from './utilities';
