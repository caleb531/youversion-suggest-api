# YouVersion Suggest for Node

_Copyright 2023 Caleb Evans_  
_Released under the MIT license_

This NodeJS package allow you to search for and fetch Bible content from
YouVersion. It is still under development, so things may break at any time.

This package is designed to run in a Node runtime, so it cannot be used in the
browser or in, for example, a Cloudflare Worker context.

## Disclaimer

**This project is not affiliated with YouVersion, and all Bible content is
copyright of the respective publishers.**

## Usage

This API thinks of Bible content in terms of Bible "references". A Bible
reference can be one of three things:

- A chapter (e.g. "Genesis 1")
- A verse (e.g. "Psalm 23:1")
- A range of verses (e.g. "Matthew 11:28-30")

Please also keep in mind that most of the functions below are asynchronous and
return promises instead of the direct values. These promise-returning functions
are identified below as being 'async'; you can also follow each example and look
for the use of the `await` syntax.

### Installation

Using npm or your preferred package manager:

```sh
npm install youversion-suggest
```

### Fetch content for a Bible reference matching the given query

The async `fetchReferenceContent()` function the textual content of a Bible
chapter, verse, or range of verses. The first argument is a query which
represents the name of the reference you want to retrieve (can be a full or
partial book name).

```ts
import { fetchReferenceContent } from 'youversion-suggest';

const content = await fetchReferenceContent('mat 11.28-30', {
  language: 'eng', // Optional
  fallback_version: 'esv', // Optional
  format: '{content}\n- {name} ({version})' // Optional
});
console.log(content);
/*
Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls. For my yoke is easy, and my burden is light.”
- Matthew 11:28-30 (ESV)
*/
```

### Retrieve a list of all Bible references matching the given query

The async `getReferencesMatchingName()` function retrieves an array of Bible
references whose names match the given query. Please note that these Bible
reference objects do not contain the textual content of the respective
references. If you want the textual content as well, you must fetch it yourself
by calling the above `fetchReferenceContent`.

```ts
import { getReferencesMatchingName } from 'youversion-suggest';

const references = await getReferencesMatchingName('a 1:1', {
  language: 'eng'
});
console.log(references);
/*
[
  {
    id: '111/AMO.1.1',
    name: 'Amos 1:1',
    url: 'https://www.bible.com/bible/111/AMO.1.1',
    book: { id: 'amo', name: 'Amos', priority: 129, metadata: [Object] },
    chapter: 1,
    verse: 1,
    endVerse: null,
    version: { full_name: 'New International Version', id: 111, name: 'NIV' }
  },
  {
    id: '111/ACT.1.1',
    name: 'Acts 1:1',
    url: 'https://www.bible.com/bible/111/ACT.1.1',
    book: { id: 'act', name: 'Acts', priority: 143, metadata: [Object] },
    chapter: 1,
    verse: 1,
    endVerse: null,
    version: { full_name: 'New International Version', id: 111, name: 'NIV' }
  }
]
*/
```

### Retrieve the first Bible reference matching the given query

The async `getFirstReferenceMatchingName()` function is a convenience function which
effectively returns the first result of the above `getReferencesMatchingName`.
The call signature is exactly the same, only returning a single Bible reference
object rather than an array of said objects.

```ts
import { getFirstReferenceMatchingName } from 'youversion-suggest';

const reference = await getFirstReferenceMatchingName('matthew 5:4', {
  language: 'eng',
  fallback_version: 'nkjv'
});
console.log(reference);
/*
{
  id: '114/MAT.5.4',
  name: 'Matthew 5:4',
  url: 'https://www.bible.com/bible/114/MAT.5.4',
  book: {
    id: 'mat',
    name: 'Matthew',
    priority: 139,
    metadata: { canon: 'nt', chapters: 28, verses: [Array] }
  },
  chapter: 5,
  verse: 4,
  endVerse: null,
  version: { full_name: 'New King James Version', id: 114, name: 'NKJV' }
}
*/
```

### Retrieve the Bible data for the specified language

The async `getBibleData()` function retrieves a JSON object containing the Bible
data for the specified language code. This Bible data includes the book names of
all 66 canonical books of the Bible, a list of the available
versions/translations for that language, and the default version for that
language.

```ts
import { getBibleData } from 'youversion-suggest';

const bible = await getBibleData('eng');
console.log(bible.books.find((book) => book.id === 'mat')?.name);
// "Matthew"
console.log(bible.versions.find((book) => version.name === 'NLT')?.full_name);
// "New Living Translation"
console.log(bible.default_version);
// 111
```

Please see [`bible-eng.json`][bible-json-example] in the
[youversion-suggest-data][yvs-data] repository for an example of how this
returned object is structured.

[bible-json-example]: https://github.com/caleb531/youversion-suggest-data/blob/main/bible/bible-eng.json

### Retrieve metadata for all books in the Biblical canon

This library does not include deuterocanonical Bible data, and therefore uses
the same number of books/chapters across all languages and
versions/translations. You can retrieve this global Bible book metadata using
the async `getBibleBookMetadata()` function. It takes no arguments, and returns
a key-value store of the metadata.

```ts
import { getBibleBookMetadata } from 'youversion-suggest';

const bookMetadata = await getBibleBookMetadata('spa');
console.log(bookMetadata.psa.canon);
// "ot"
console.log(bookMetadata.psa.chapters);
// 150
console.log(bookMetadata.psa.verses[118]); // Psalm 119
// 176
```

Please see [book-metadata.json][bible-book-metadata-json] in the
[youversion-suggest-data][yvs-data] repository for an example of how this
returned object is structured.

[bible-book-metadata-json]: https://github.com/caleb531/youversion-suggest-data/blob/main/bible/book-metadata.json
[yvs-data]: https://github.com/caleb531/youversion-suggest-data

### Default Options

Most of the search/lookup functions above accept an options object. All of the
parameters are optional and have the following defaults:

```ts
{
  language: 'eng',
  version: 'niv',
  fallback_version: 'niv',
  format: '{name} ({version})\n\n{content}'
}
```
