// The base class for errors related to Bible references
export class BibleReferenceError extends Error {}
// The error thrown when a Bible reference is not found or non-existent
export class BibleReferenceNotFoundError extends BibleReferenceError {}
// The error thrown when the content for a Bible reference could not be parsed
export class BibleReferenceEmptyContentError extends BibleReferenceError {}
